import unittest

import elastic


class MetadataAggregationElasticsearch:
    def search(self, index, body):
        self.index = index
        self.body = body
        return {
            "aggregations": {
                "transport_breakdown": {
                    "buckets": [{"key": "TCP", "total": {"value": 12}}]
                },
                "application_breakdown": {
                    "buckets": [{"key": "HTTP", "total": {"value": 8}}]
                },
                "direction_breakdown": {
                    "buckets": [{"key": "inbound", "total": {"value": 4}}]
                },
                "top_dns_domains": {
                    "buckets": [{"key": "example.test", "total": {"value": 3}}]
                },
                "top_url_domains": {
                    "buckets": [{"key": "example.test", "total": {"value": 2}}]
                },
                "infected_hosts": {"buckets": []},
            }
        }


class MetadataAggregationTests(unittest.TestCase):
    def test_aggregates_use_keyword_fields_from_metadata_mapping(self):
        es = MetadataAggregationElasticsearch()
        stats = {}

        elastic._apply_metadata_aggs(es, stats)

        aggregations = es.body["aggs"]
        for name in (
            "transport_breakdown",
            "application_breakdown",
            "direction_breakdown",
            "top_dns_domains",
            "top_url_domains",
        ):
            self.assertEqual(
                aggregations[name]["terms"]["field"],
                f"{name}.label",
            )
        self.assertEqual(
            aggregations["infected_hosts"]["terms"]["field"],
            "infected_host",
        )
        self.assertEqual(stats["transport_breakdown"], [{"label": "TCP", "value": 12}])
        self.assertEqual(stats["application_breakdown"], [{"label": "HTTP", "value": 8}])
        self.assertEqual(stats["direction_breakdown"], [{"label": "inbound", "value": 4}])
        self.assertEqual(stats["top_dns_domains"], [{"label": "example.test", "value": 3}])
        self.assertEqual(stats["top_url_domains"], [{"label": "example.test", "value": 2}])


if __name__ == "__main__":
    unittest.main()
