import os
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app_deploy import app


class SynchronousPdfExportTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()
        self.environment = patch.dict(
            os.environ,
            {
                "JWT_SECRET": "pdf-export-test-secret-that-is-at-least-32-bytes",
                "AUTH_ADMIN_USERNAME": "pdf-admin",
                "AUTH_ADMIN_PASSWORD": "admin-password",
                "AUTH_USER_USERNAME": "pdf-user",
                "AUTH_USER_PASSWORD": "user-password",
                "AUTH_REVOCATION_DB": os.path.join(
                    self.temp_directory.name,
                    "revocations.sqlite3",
                ),
            },
        )
        self.environment.start()
        self.client = TestClient(app)
        login = self.client.post(
            "/api/auth/login",
            json={"username": "pdf-user", "password": "user-password"},
        )
        self.assertEqual(login.status_code, 200)
        self.headers = {
            "Authorization": f"Bearer {login.json()['data']['access_token']}"
        }

    def tearDown(self):
        self.environment.stop()
        self.temp_directory.cleanup()

    @patch("app_deploy._build_ip_rows_sync", return_value=[])
    @patch("app_deploy.elastic.get_report_details", return_value=[])
    @patch("app_deploy.celery_client.send_task")
    def test_global_report_export_returns_pdf_without_celery(
        self,
        send_task,
        _get_report_details,
        _build_ip_rows,
    ):
        response = self.client.get(
            "/api/export/country",
            params={"value": "United States", "sync": "true"},
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["content-type"],
            "application/pdf",
            response.text,
        )
        self.assertIn("country_United_States_report.pdf", response.headers["content-disposition"])
        self.assertTrue(response.content.startswith(b"%PDF"))
        send_task.assert_not_called()

    @patch("app_deploy._build_ip_rows_sync", return_value=[])
    @patch("app_deploy.elastic.get_pcap_report_details", return_value=[])
    @patch("app_deploy.celery_client.send_task")
    def test_pcap_report_export_returns_pdf_without_celery(
        self,
        send_task,
        _get_pcap_report_details,
        _build_ip_rows,
    ):
        response = self.client.get(
            "/api/reports/capture-1/country/United%20States/export",
            params={"sync": "true"},
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["content-type"],
            "application/pdf",
            response.text,
        )
        self.assertIn("capture-1_country_United_States_report.pdf", response.headers["content-disposition"])
        self.assertTrue(response.content.startswith(b"%PDF"))
        send_task.assert_not_called()

    @patch("app_deploy.elastic.get_report_details", return_value=[])
    def test_pcap_report_details_route_is_not_captured_by_global_route(
        self,
        get_report_details,
    ):
        with patch("app_deploy.elastic.get_pcap_report_details", return_value=[]) as get_pcap_details:
            response = self.client.get(
                "/api/reports/capture-1/country/United%20States",
                headers=self.headers,
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], [])
        get_pcap_details.assert_called_once_with(
            "capture-1",
            "country",
            "United States",
        )
        get_report_details.assert_not_called()


if __name__ == "__main__":
    unittest.main()
