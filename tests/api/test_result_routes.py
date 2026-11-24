import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import AsyncMock, patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
from src.config import Settings, get_settings
from src.geojson.router import router

TOKEN = "3dcd86e4-e297-45a7-bd19-f234f252056a"
RESULT = {"type": "FeatureCollection", "features": [
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [0, 0]},
     "properties": {"plotId": "1", "Country": "Brazil", "risk_pcrop": "low"}},
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [1, 1]},
     "properties": {"plotId": "2", "Country": "France", "risk_pcrop": "high"}},
]}


class ExportRouteTests(unittest.TestCase):
    def setUp(self):
        directory = self.enterContext(tempfile.TemporaryDirectory())
        self.directory = Path(directory)
        self.settings = Settings(_env_file=None, temp_dir=self.directory)
        app = FastAPI()
        example = (ROOT / "api/.env.example").read_text()
        origins = next(line.split("=", 1)[1] for line in example.splitlines() if line.startswith("ALLOWED_ORIGINS="))
        app.add_middleware(CORSMiddleware, allow_origins=origins.split(","), allow_methods=["*"],
                           allow_headers=["*"], expose_headers=["Content-Disposition"])
        app.include_router(router, prefix="/api")
        app.dependency_overrides[get_settings] = lambda: self.settings
        self.app = app
        self.enterContext(patch("src.io.files.get_settings", return_value=self.settings))
        self.fetch_fields = self.enterContext(patch("src.geojson.router.fetch_result_fields", new_callable=AsyncMock))
        self.fetch_fields.return_value = [{"id": "plotId", "order": 0, "display_metadata": {"displayName": "Plot ID"}}]
        self.path = self.directory / f"{TOKEN}-result.json"
        self.path.write_text(json.dumps(RESULT))
        self.client = self.enterContext(TestClient(app))

    def test_geojson_alias_preserves_filters(self):
        for query in ("", "?ids=2", "?q=brazil", "?risk_pcrop=high", "?ids=1&q=brazil&risk_pcrop=low"):
            with self.subTest(query=query):
                old = self.client.get(f"/api/generate-geojson/{TOKEN}{query}")
                new = self.client.get(f"/api/results/{TOKEN}.geojson{query}")
                self.assertEqual(old.status_code, 200)
                self.assertEqual(new.json(), old.json())
        filtered = self.client.get(f"/api/results/{TOKEN}.geojson?ids=2").json()
        self.assertEqual(filtered["features"][0]["properties"]["plotId"], "2")
        self.assertEqual(len(filtered["features"]), 1)

    def test_csv_alias_and_cached_output(self):
        new = self.client.get(f"/api/results/{TOKEN}.csv")
        old = self.client.get(f"/api/download-csv/{TOKEN}")
        self.assertEqual(new.status_code, 200)
        self.assertEqual(new.content, old.content)
        self.assertIn("text/csv", new.headers["content-type"])
        self.assertIn("attachment", new.headers["content-disposition"])
        self.assertTrue((self.directory / f"{TOKEN}-result.csv").exists())

    def test_html_download(self):
        response = self.client.get(f"/api/results/{TOKEN}.html?language=pt-BR&theme=dark")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response.headers["content-type"])
        self.assertIn("attachment", response.headers["content-disposition"])
        self.assertEqual(response.headers["cache-control"], "no-store")
        self.assertEqual(response.headers["x-content-type-options"], "nosniff")
        self.assertIn("default-src 'none'", response.headers["content-security-policy"])
        self.assertIn(response.headers["content-security-policy"], response.text)
        self.assertIn('<html lang="pt-BR" data-theme="dark">', response.text)
        data = response.text.split('<script type="application/json" id="data">')[1].split('</script>')[0]
        report = json.loads(data)
        self.assertEqual(report["plotCount"], 2)
        self.assertEqual(report["columns"][0]["header"], "Plot ID")
        self.assertEqual(report["commodities"][0]["label"], "Cultura perene")

    def test_cors_for_local_development(self):
        for origin in ("http://localhost:3000", "http://localhost:3001"):
            with self.subTest(origin=origin):
                response = self.client.get(f"/api/results/{TOKEN}.html", headers={"Origin": origin})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.headers["access-control-allow-origin"], origin)
                self.assertIn("Content-Disposition", response.headers["access-control-expose-headers"])
                preflight = self.client.options(f"/api/results/{TOKEN}.html", headers={
                    "Origin": origin, "Access-Control-Request-Method": "GET",
                })
                self.assertEqual(preflight.status_code, 200)
                self.assertEqual(preflight.headers["access-control-allow-origin"], origin)
        response = self.client.get(f"/api/results/{TOKEN}.html", headers={"Origin": "http://unlisted.example"})
        self.assertNotIn("access-control-allow-origin", response.headers)

    def test_missing_or_expired_results(self):
        self.path.unlink()
        for path in (f"results/{TOKEN}.html", f"results/{TOKEN}.geojson", f"results/{TOKEN}.csv",
                     f"generate-geojson/{TOKEN}", f"download-csv/{TOKEN}"):
            with self.subTest(path=path):
                response = self.client.get("/api/" + path)
                self.assertEqual(response.status_code, 404)
                self.assertEqual(response.json()["code"], "analysis_job_not_found")
                self.assertNotIn(str(self.directory), response.text)
        self.fetch_fields.assert_not_awaited()

    def test_invalid_tokens_and_options(self):
        for extension in ("html", "geojson", "csv"):
            response = self.client.get(f"/api/results/invalid%5Ctoken.{extension}")
            self.assertEqual(response.status_code, 404)
        for query in ("language=unknown", "theme=unknown"):
            response = self.client.get(f"/api/results/{TOKEN}.html?{query}")
            self.assertEqual(response.status_code, 422)
        self.fetch_fields.assert_not_awaited()

    def test_corrupt_result_and_catalog_failure(self):
        self.path.write_text("not json")
        with self.assertLogs("src.geojson.router", level="ERROR"):
            response = self.client.get(f"/api/results/{TOKEN}.html")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json()["code"], "system_internal_server_error")
        self.assertNotIn(str(self.directory), response.text)
        self.path.write_text(json.dumps(RESULT))
        self.fetch_fields.side_effect = RuntimeError("database unavailable")
        with self.assertLogs("src.geojson.router", level="ERROR"):
            response = self.client.get(f"/api/results/{TOKEN}.html")
        self.assertEqual(response.status_code, 500)
        self.assertNotIn("database unavailable", response.text)

    def test_openapi_aliases_are_deprecated(self):
        paths = self.app.openapi()["paths"]
        for path in ("/api/generate-geojson/{token}", "/api/download-csv/{token}"):
            self.assertTrue(paths[path]["get"]["deprecated"])
        for extension in ("html", "geojson", "csv"):
            self.assertFalse(paths[f"/api/results/{{token}}.{extension}"]["get"].get("deprecated", False))
        content = paths["/api/results/{token}.html"]["get"]["responses"]["200"]["content"]
        self.assertEqual(list(content), ["text/html"])


if __name__ == "__main__":
    unittest.main()
