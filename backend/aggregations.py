from elastic import get_es, get_pcap_ids_for_sinkhole, PCAP_METADATA_INDEX, PCAP_IPS_INDEX, IP_INTEL_INDEX
from collections import defaultdict

SCRIPTED_METRIC_INIT_MAP = "state.map = [:]"
SCRIPTED_METRIC_COMBINE_MAP = "return state.map"
SCRIPTED_METRIC_REDUCE_MAP = "def out = [:]; for (s in states) { for (e in s.entrySet()) { out.put(e.getKey(), out.getOrDefault(e.getKey(), 0) + e.getValue()); } } return out"



def get_country_city_map(limit=100, sinkhole_id=None):
    """
    Aggregate external IPs by country and city for map visualization.
    Returns list of locations with IP counts and coordinates from IP_INTEL_INDEX.
    """
    es = get_es()
    if not es:
        return []

    try:
        pcap_ids = get_pcap_ids_for_sinkhole(sinkhole_id, es) if sinkhole_id is not None else None
        if pcap_ids == []:
            return []
        body = _build_country_city_map_body(pcap_ids=pcap_ids)
        res = es.search(index=PCAP_IPS_INDEX, body=body)
        locations = _extract_country_city_locations(res.get('aggregations', {}))
        locations.sort(key=lambda x: x['ip_count'], reverse=True)
        return locations[:limit]
    except Exception as e:
        print(f"get_country_city_map error: {e}")
        return []


def _build_country_city_map_body(pcap_ids=None):
    return {
        "query": {"match_all": {}} if pcap_ids is None else {"terms": {"pcap_id": pcap_ids}},
        "size": 0,
        "aggs": {
            "external": {
                "nested": {"path": "external_ips"},
                "aggs": {
                    "by_country": {
                        "terms": {"field": "external_ips.country", "size": 1000},
                        "aggs": {
                            "by_city": {
                                "terms": {"field": "external_ips.city", "size": 1000, "missing": "Unknown"},
                                "aggs": {
                                    "packets": {"sum": {"field": "external_ips.packet_count"}},
                                    "avg_lat": {"avg": {"field": "external_ips.latitude"}},
                                    "avg_lon": {"avg": {"field": "external_ips.longitude"}},
                                }
                            }
                        }
                    }
                }
            }
        }
    }


def _extract_country_city_locations(aggs):
    locations = []
    for country_bucket in (
        aggs.get('external', {})
            .get('by_country', {})
            .get('buckets', [])
    ):
        country = country_bucket.get('key')
        if _should_skip_country(country):
            continue

        for city_bucket in country_bucket.get('by_city', {}).get('buckets', []):
            location = _country_city_location_from_bucket(country, city_bucket)
            if location is not None:
                locations.append(location)

    return locations


def _should_skip_country(country):
    return not country or str(country).strip() == 'Unknown'


def _country_city_location_from_bucket(country, city_bucket):
    lat, lon = _extract_coordinates(city_bucket)
    if lat is None or lon is None:
        return None

    packet_count = int(city_bucket.get('packets', {}).get('value', 0) or 0)

    return {
        'country': country,
        'city': city_bucket.get('key') or 'Unknown',
        'latitude': lat,
        'longitude': lon,
        'ip_count': int(city_bucket.get('doc_count', 0)),
        'packets': packet_count,
        'packet_count': packet_count,
    }


def _extract_coordinates(city_bucket):
    lat = city_bucket.get('avg_lat', {}).get('value')
    lon = city_bucket.get('avg_lon', {}).get('value')
    return lat, lon


def get_all_external_ips(limit=10000, sinkhole_id=None):
    """
    Retrieve all external IPs with their enrichment data from IP_INTEL_INDEX.
    Returns detailed IP records with WHOIS, geo, ports, etc.
    """
    es = get_es()
    if not es:
        return []

    try:
        if sinkhole_id is not None:
            pcap_ids = get_pcap_ids_for_sinkhole(sinkhole_id, es)
            if not pcap_ids:
                return []
            pcap_res = es.search(index=PCAP_IPS_INDEX, body={
                "query": {"terms": {"pcap_id": pcap_ids}},
                "_source": ["external_ips.ip"],
                "size": 10000,
            })
            ips = sorted({
                entry.get("ip")
                for hit in pcap_res.get("hits", {}).get("hits", [])
                for entry in hit.get("_source", {}).get("external_ips", [])
                if entry.get("ip")
            })[:limit]
            if not ips:
                return []
            res = es.search(index=IP_INTEL_INDEX, body={
                "query": {"terms": {"ip": ips}},
                "size": min(limit, 10000),
                "_source": [
                    "ip", "rdns", "asn", "geo", "whois", "dnsbl",
                    "os_info", "hostnames", "ports", "scan_time"
                ],
            })
            return [hit.get("_source", {}) for hit in res.get("hits", {}).get("hits", [])]

        # Use scrolling for large result sets to avoid ES size limits and memory spikes
        if limit <= 10000:
            res = es.search(
                index=IP_INTEL_INDEX,
                body={
                    "query": {"match_all": {}},
                    "size": limit,
                    "_source": [
                        "ip", "rdns", "asn", "geo", "whois", "dnsbl",
                        "os_info", "hostnames", "ports", "scan_time"
                    ]
                }
            )
            return [hit.get("_source", {}) for hit in res.get("hits", {}).get("hits", [])]

        # limit > 10000 -> use scroll
        rows = []
        scroll_resp = es.search(
            index=IP_INTEL_INDEX,
            body={"query": {"match_all": {}}, "_source": [
                "ip", "rdns", "asn", "geo", "whois", "dnsbl",
                "os_info", "hostnames", "ports", "scan_time"
            ]},
            size=10000,
            scroll="2m"
        )
        sid = scroll_resp.get("_scroll_id")
        while True:
            hits = scroll_resp.get("hits", {}).get("hits", [])
            if not hits:
                break
            for h in hits:
                rows.append(h.get("_source", {}))
                if len(rows) >= limit:
                    break
            if len(rows) >= limit:
                break
            scroll_resp = es.scroll(scroll_id=sid, scroll="2m")

        try:
            if sid:
                es.clear_scroll(scroll_id=sid)
        except Exception:
            pass

        return rows
    except Exception as e:
        print(f"get_all_external_ips error: {e}")
        return []



def get_external_ips_global(limit=10000, sinkhole_id=None):
    """Aggregate external IPs across all or selected sinkhole PCAPs.

    Returns one record per distinct IP with its total packet count (across all
    captures) plus geo (country/city/isp/latitude/longitude). Used by the
    overall map view so each IP shows its combined packet count.
    """
    es = get_es()
    if not es:
        return []
    try:
        pcap_ids = get_pcap_ids_for_sinkhole(sinkhole_id, es) if sinkhole_id is not None else None
        if pcap_ids == []:
            return []
        res = es.search(index=PCAP_IPS_INDEX, body={
            "query": {"match_all": {}} if pcap_ids is None else {"terms": {"pcap_id": pcap_ids}},
            "size": 0,
            "aggs": {"ext": {"nested": {"path": "external_ips"}, "aggs": {
                "by_ip": {
                    "terms": {
                        "field": "external_ips.ip",
                        "size": limit,
                        "order": {"packets": "desc"},
                    },
                    "aggs": {
                        "packets": {"sum": {"field": "external_ips.packet_count"}},
                        "geo": {"top_hits": {
                            "size": 1,
                            "_source": ["external_ips.country", "external_ips.city",
                                        "external_ips.isp", "external_ips.latitude",
                                        "external_ips.longitude"],
                        }},
                    },
                }
            }}}
        })
    except Exception as e:
        print(f"get_external_ips_global error: {e}")
        return []

    buckets = (res.get("aggregations", {})
                  .get("ext", {})
                  .get("by_ip", {})
                  .get("buckets", []))
    records = []
    for b in buckets:
        hits = b.get("geo", {}).get("hits", {}).get("hits", [])
        src = hits[0].get("_source", {}) if hits else {}
        packets = int(b.get("packets", {}).get("value", 0) or 0)
        records.append({
            "ip": b["key"],
            "packet_count": packets,
            "packets": packets,
            "country": src.get("country"),
            "city": src.get("city"),
            "isp": src.get("isp"),
            "latitude": src.get("latitude"),
            "longitude": src.get("longitude"),
        })
    return records


def aggregate_geo_from_external_ips(es_client, pcap_id):
    """Aggregate country/isp/city from pcap-ips external_ips using nested terms aggs."""
    res = es_client.search(index=PCAP_IPS_INDEX, body={
        "query": {"term": {"pcap_id": pcap_id}},
        "size": 0,
        "aggs": {"ext": {"nested": {"path": "external_ips"}, "aggs": {
            "countries": {"terms": {"field": "external_ips.country", "size": 10000},
                          "aggs": {"packets": {"sum": {"field": "external_ips.packet_count"}}}},
            "cities":    {"terms": {"field": "external_ips.city",    "size": 10000},
                          "aggs": {"packets": {"sum": {"field": "external_ips.packet_count"}}}},
            "isps":      {"terms": {"field": "external_ips.isp",     "size": 10000},
                          "aggs": {"packets": {"sum": {"field": "external_ips.packet_count"}}}},
        }}}
    })
    ext = res.get("aggregations", {}).get("ext", {})
    def _fmt(key):
        return sorted(
            [{"name": b["key"], "packets": int(b["packets"]["value"] or 0), "ip_count": b["doc_count"]}
             for b in ext.get(key, {}).get("buckets", []) if b.get("key")],
            key=lambda x: x["ip_count"], reverse=True
        )
    return {"countries": _fmt("countries"), "cities": _fmt("cities"), "isps": _fmt("isps")}


def aggregate_geo_from_es(es_client, ips_index, pcap_ids=None):
    """Run global geo aggregation via nested terms aggs on pcap-ips index."""
    res = es_client.search(index=ips_index, body={
        "query": {"match_all": {}} if pcap_ids is None else {"terms": {"pcap_id": pcap_ids}},
        "size": 0,
        "aggs": {"ext": {"nested": {"path": "external_ips"}, "aggs": {
            "countries": {"terms": {"field": "external_ips.country", "size": 10000},
                          "aggs": {"packets": {"sum": {"field": "external_ips.packet_count"}}}},
            "cities":    {"terms": {"field": "external_ips.city",    "size": 10000},
                          "aggs": {"packets": {"sum": {"field": "external_ips.packet_count"}}}},
            "isps":      {"terms": {"field": "external_ips.isp",     "size": 10000},
                          "aggs": {"packets": {"sum": {"field": "external_ips.packet_count"}}}},
        }}}
    })
    ext = res.get("aggregations", {}).get("ext", {})
    def _fmt(key):
        return sorted(
            [{"name": b["key"], "count": b["doc_count"], "packets": int(b["packets"]["value"] or 0)}
             for b in ext.get(key, {}).get("buckets", []) if b.get("key")],
            key=lambda x: x["count"], reverse=True
        )
    return {"countries": _fmt("countries"), "cities": _fmt("cities"), "isps": _fmt("isps")}


def enrich_packet_counts(es_client, ips_index, matched_ips, hits):
    """Add packet counts to matched_ips using nested terms+sum agg.

    The terms aggregation is restricted to the target IPs via `include` and a
    nested `filter`, so the summed packet counts correspond to exactly the IPs
    being enriched (rather than the globally top-N IPs in the index).
    """
    target_ips = [ip for ip in matched_ips.keys() if ip]
    if not target_ips:
        return
    try:
        # ES terms `include` supports up to 65536 values; chunk to stay safe.
        for start in range(0, len(target_ips), 60000):
            chunk = target_ips[start:start + 60000]
            res = es_client.search(index=ips_index, body={"size": 0, "aggs": {
                "ext": {"nested": {"path": "external_ips"}, "aggs": {
                    "matching": {
                        "filter": {"terms": {"external_ips.ip": chunk}},
                        "aggs": {
                            "by_ip": {
                                "terms": {"field": "external_ips.ip", "size": len(chunk), "include": chunk},
                                "aggs": {"packets": {"sum": {"field": "external_ips.packet_count"}}}
                            }
                        }
                    }
                }}
            }})
            buckets = (res.get("aggregations", {})
                          .get("ext", {})
                          .get("matching", {})
                          .get("by_ip", {})
                          .get("buckets", []))
            for b in buckets:
                ip = b["key"]
                if ip in matched_ips:
                    matched_ips[ip]["packet_count"] = int(b["packets"]["value"] or 0)
    except Exception as e:
        print(f"enrich_packet_counts error: {e}")


def sort_ip_rows(rows):
    """Sort IP rows: IPs with packets first, then by descending packets, then by IP string."""
    return sorted(rows, key=lambda row: (
        0 if (row.get("packet_count") or 0) > 0 else 1,
        -(row.get("packet_count") or 0),
        str(row.get("ip") or "")
    ))


def filter_ips_by_field(es_client, pcap_id, field, value):
    """Filter external_ips for a pcap by field==value using scripted_metric."""
    try:
        res = es_client.search(index=PCAP_IPS_INDEX, body={
            "query": {"term": {"pcap_id": pcap_id}},
            "size": 0,
            "aggs": {"ext": {"scripted_metric": {
                "init_script": "state.map = [:]",
                "map_script": """
                    if (params._source.external_ips == null) return;
                    for (item in params._source.external_ips) {
                        def v = item[params.field];
                        if (v == null || v.toString() != params.value) continue;
                        def ip = item.ip;
                        if (ip == null) continue;
                        def k = ip.toString();
                        if (!state.map.containsKey(k)) {
                            state.map[k] = ['packets': 0, 'country': item.country, 'city': item.city, 'isp': item.isp, 'latitude': item.latitude, 'longitude': item.longitude];
                        }
                        state.map[k]['packets'] += item.packet_count == null ? 0 : item.packet_count;
                    }
                """,
                "combine_script": "return state.map",
                "reduce_script": "def out = [:]; for (s in states) { if (s == null) continue; for (e in s.entrySet()) { if (!out.containsKey(e.getKey())) { out[e.getKey()] = e.getValue(); } else { out[e.getKey()]['packets'] += e.getValue()['packets']; } } } return out",
                "params": {"field": field, "value": value}
            }}}
        })
        ip_map = res.get("aggregations", {}).get("ext", {}).get("value") or {}
        return [
            {
                "ip":           ip,
                "packet_count": int(v["packets"]),
                "country":      v.get("country") or "Unknown",
                "city":         v.get("city") or "Unknown",
                "isp":          v.get("isp") or "Unknown",
                "latitude":     v.get("latitude"),
                "longitude":    v.get("longitude"),
            }
            for ip, v in ip_map.items()
        ]
    except Exception as e:
        print(f"filter_ips_by_field error: {e}")
        return []


