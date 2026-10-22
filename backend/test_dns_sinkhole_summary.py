import unittest
from unittest.mock import patch

import elastic


class FakeElasticsearch:
    def count(self, **_kwargs):
        return {"count": 1}

    def search(self, index, body, scroll=None):
        if index == elastic.PCAP_METADATA_INDEX:
            return {"hits": {"hits": [{"_source": {"pcap_id": "pcap-1"}}]}}
        if index == elastic.PCAP_IPS_INDEX:
            documents = [
                {
                    "pcap_id": "pcap-1",
                    "external_ips": [
                        {
                            "ip": "203.0.113.5",
                            "country": "Republic of India",
                            "latitude": 28.6,
                            "longitude": 77.2,
                        }
                    ],
                    "internal_ips": [],
                }
            ]
        else:
            documents = [
                {
                    "pcap_id": "pcap-1",
                    "host": "example.test",
                    "request_count": 4,
                    "connected_ips": [
                        {
                            "ip": "203.0.113.5",
                            "isp": "ISP X",
                            "latitude": 28.5,
                            "longitude": 77.1,
                        }
                    ],
                }
            ]
        return {
            "_scroll_id": index,
            "hits": {"hits": [{"_source": document} for document in documents]},
        }

    def scroll(self, scroll_id, scroll):
        return {"_scroll_id": scroll_id, "hits": {"hits": []}}

    def clear_scroll(self, scroll_id):
        return {"succeeded": True}


class DnsSinkholeSummaryTests(unittest.TestCase):
    @patch("elastic.get_es", return_value=FakeElasticsearch())
    def test_isp_ip_entries_include_country_and_coordinates(self, _get_es):
        summary = elastic.get_dns_sinkhole_summary(2)

        self.assertEqual(
            summary["top_isps"][0]["ips"],
            [
                {
                    "ip": "203.0.113.5",
                    "latitude": 28.6,
                    "longitude": 77.2,
                    "country": "India",
                }
            ],
        )


if __name__ == "__main__":
    unittest.main()
