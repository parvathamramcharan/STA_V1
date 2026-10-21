"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, MapPin } from "lucide-react";
import { WorldMapLeaflet } from "../../../../dashboard/WorldMapLeaflet";
import { fetchGlobalMapData } from "../../../../dashboard/dashboardApiService";

const EMPTY_IPS = [];

const hasCoordinates = (record) => {
  if (record?.latitude == null || record?.longitude == null) return false;
  if (record.latitude === "" || record.longitude === "") return false;

  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

export default function DomainMap({
  selectedDomain,
  setActiveTab,
  setSelectedIp,
}) {
  const connectedIps = selectedDomain?.connected_ips ?? EMPTY_IPS;
  const domainHost = selectedDomain?.host;
  const [mapState, setMapState] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const needsLookup = connectedIps.some((record) => !hasCoordinates(record));

    if (!needsLookup || !domainHost) return undefined;

    fetchGlobalMapData()
      .then((response) => {
        if (!cancelled) {
          setMapState({
            host: domainHost,
            records: Array.isArray(response?.data) ? response.data : [],
            error: "",
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMapState({
            host: domainHost,
            records: [],
            error: "Could not load IP location data.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectedIps, domainHost]);

  const loading =
    Boolean(domainHost) &&
    connectedIps.some((record) => !hasCoordinates(record)) &&
    mapState?.host !== domainHost;
  const error = mapState?.host === domainHost ? mapState.error : "";

  const locatedIps = useMemo(() => {
    const mapRecords = mapState?.host === domainHost ? mapState.records : [];
    const wantedIps = new Set(connectedIps.map((record) => record.ip));
    const recordsByIp = new Map();

    mapRecords.forEach((record) => {
      if (!wantedIps.has(record.ip) || !hasCoordinates(record)) return;
      const records = recordsByIp.get(record.ip) ?? [];
      records.push(record);
      recordsByIp.set(record.ip, records);
    });

    return connectedIps.flatMap((record) => {
      if (hasCoordinates(record)) return [record];
      return recordsByIp.get(record.ip) ?? [];
    });
  }, [connectedIps, domainHost, mapState]);

  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden rounded-xl border border-theme bg-card">
      <WorldMapLeaflet
        externalIps={locatedIps}
        mode="reports"
        onIpClick={(ip) => {
          setSelectedIp(ip);
          setActiveTab("IPSearch");
        }}
      />

      <div className="absolute left-3 top-3 z-[800] flex items-center gap-2 rounded-lg border border-theme bg-card/95 px-3 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur">
        {loading ? (
          <Activity size={14} className="animate-spin text-blue-500" />
        ) : (
          <MapPin size={14} className="text-blue-500" />
        )}
        <span>
          {loading
            ? "Locating domain IPs..."
            : `${locatedIps.length} mapped IP${locatedIps.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {!loading && locatedIps.length === 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-[800] rounded-lg border border-amber-500/20 bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
          {error ||
            "No location coordinates are available for this domain's IPs."}
        </div>
      )}
    </div>
  );
}
