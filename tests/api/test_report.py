import itertools
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "api"))
from src.geojson.html_export import build_report, render_report

TOKEN = "3dcd86e4-e297-45a7-bd19-f234f252056a"
INDICATORS = [
    "Ind_01_treecover", "Ind_02_commodities", "Ind_03_disturbance_before_2020",
    "Ind_04_disturbance_after_2020", "Ind_05_primary_2020", "Ind_06_nat_reg_forest_2020",
    "Ind_10_agri_after_2020", "Ind_12_other_land_2020", "Ind_13_other_land_gain_after_2020",
    "Ind_14_planted_forest_2020", "Ind_15_cropland_2020", "Ind_16_plantation_forest_2020",
    "Ind_17_plantation_forest_gain_after_2020",
]


def collection(rows):
    return {"type": "FeatureCollection", "features": [
        {"type": "Feature", "geometry": None, "properties": row} for row in rows
    ]}


def sample():
    return collection([
        {"plotId": "1", "external_id": "a", "risk_pcrop": "low", "In_waterbody": True,
         "Ind_01_treecover": "no", "Ind_02_commodities": "yes"},
        {"plotId": "2", "external_id": None, "risk_pcrop": "more_info_needed", "In_waterbody": "NO",
         "Ind_01_treecover": True, "Ind_02_commodities": "false"},
        {"plotId": "3", "risk_pcrop": "high", "In_waterbody": "TRUE",
         "Ind_01_treecover": "yes", "Ind_02_commodities": False},
        {"plotId": "4", "risk_pcrop": None, "Ind_01_treecover": 1},
    ])


class ReportTests(unittest.TestCase):
    def test_counts_and_sequential_tree_branches(self):
        report = build_report(sample(), [], TOKEN)
        self.assertEqual(report["plotCount"], 4)
        crop = report["commodities"][0]
        self.assertEqual(crop["mix"], {"low": 1, "medium": 1, "high": 1, "total": 4})
        self.assertEqual(report["otherIndicators"][0]["yes"], 2)
        self.assertEqual([step["matchCount"] for step in crop["tree"]], [2, 0, 0, 0])
        self.assertEqual([step["restCount"] for step in crop["tree"]], [2, 2, 2, 2])
        self.assertEqual(crop["tree"][-1]["otherwise"], "more_info_needed")

    def test_field_order_headers_and_values(self):
        result = collection([{"other": [None, True, {"nested": 1}], "plotId": "a", "Country": "BR", "geo": {}}])
        fields = [{"id": "Country", "order": 1, "display_metadata": '{"displayName":"Country name"}'},
                  {"id": "plotId", "order": 0, "display_metadata": {}}]
        report = build_report(result, fields, TOKEN)
        self.assertEqual([c["key"] for c in report["columns"]], ["plotId", "Country", "other"])
        self.assertEqual(report["columns"][1]["header"], "Country name")
        self.assertEqual(report["rows"][0]["other"], ",true,[object Object]")

    def test_empty_results_and_missing_properties(self):
        self.assertEqual(build_report(collection([]), [], TOKEN)["rows"], [])
        self.assertEqual(build_report(collection([{}]), [], TOKEN)["plotCount"], 1)
        with self.assertRaises(ValueError):
            build_report({"type": "Feature"}, [], TOKEN)

    def test_language_and_theme(self):
        for language in ("en", "fr", "es", "pt-BR"):
            report = build_report(sample(), [], TOKEN, language)
            labels = json.loads((ROOT / "app/messages" / f"{language}.json").read_text())["Results"]
            self.assertEqual(report["commodities"][0]["label"], labels["commodity"]["pcrop"])
            html = render_report(report, "dark", language)
            self.assertIn(f'<html lang="{language}" data-theme="dark">', html)
        with self.assertRaises(ValueError):
            render_report({}, '" onload="alert(1)')

    def test_script_escaping_and_placeholder_values(self):
        value = '</script><script>window.injected=true</script> __WHISP_THEME__ __WHISP_DATA__ __WHISP_LANG__ __WHISP_CSP__ <&"'
        report = build_report(collection([{"plotId": value}]), [], TOKEN)
        html = render_report(report)
        self.assertNotIn('</script><script>window.injected', html)
        data = html.split('<script type="application/json" id="data">')[1].split('</script>')[0]
        self.assertEqual(json.loads(data)["rows"][0]["plotId"], value)
        self.assertIn("document.createElement('a')", html)
        self.assertNotIn('<script src=', html)
        self.assertNotIn('<link ', html)
        self.assertIn('<meta http-equiv="Content-Security-Policy"', html)
        self.assertIn("default-src 'none'", html)

    def test_numeric_cells_and_empty_display_names(self):
        report = build_report(collection([{
            "plotId": "1", "numbers": [1.0, -0.0, 1e-7, 1e20, 1e21, float("nan"), float("inf")],
            "missing": float("nan"),
        }]), [{"id": "plotId", "display_metadata": {"displayName": ""}}], TOKEN)
        self.assertEqual(report["rows"][0]["numbers"], "1,0,1e-7,100000000000000000000,1e+21,NaN,Infinity")
        self.assertIsNone(report["rows"][0]["missing"])
        self.assertEqual(report["columns"][0]["header"], "")
        self.assertRegex(report["exportedAt"], r"\.\d{3}Z$")
        render_report(report)

    def test_browser_parity(self):
        node = os.environ.get("NODE") or shutil.which("node")
        compiler = os.environ.get("TYPESCRIPT_PATH") or str(ROOT / "app/node_modules/typescript")
        if not node or not Path(compiler).exists():
            self.skipTest("Needs Node.js and app's TypeScript dependency (npm ci)")
        # Exhaust all indicator combinations, including the nested timber branches.
        rows = []
        for index, flags in enumerate(itertools.product((True, False), repeat=len(INDICATORS))):
            row = dict(zip(INDICATORS, flags))
            row.update(plotId=str(index), risk_pcrop=("low", "high", "more_info_needed", None)[index % 4],
                       risk_acrop="low", risk_timber="high", In_waterbody=index % 2 == 0)
            rows.append(row)
        rows.extend(feature["properties"] for feature in sample()["features"])
        rows[0]["external_id"] = '</script> __WHISP_DATA__'
        rows[0]["extra"] = [None, True, {"nested": 1}, 1.0, -0.0, 1e-7, 1e20, 1e21, 0.000001, 1.25]
        geojson = collection(rows)
        keys = list(rows[0])
        fields = [{"id": key, "order": index, "display_metadata": {"displayName": f"Field {key}"}}
                  for index, key in enumerate(keys)]
        columns = [{"key": key, "header": f"Field {key}"} for key in keys]
        fields[0]["display_metadata"]["displayName"] = ""
        columns[0]["header"] = ""
        env = {**os.environ, "TYPESCRIPT_PATH": compiler}
        for language in ("en", "fr", "es", "pt-BR"):
            with self.subTest(language=language):
                payload = {"rows": rows, "columns": columns, "language": language, "token": TOKEN}
                output = subprocess.run([node, str(ROOT / "tests/api/report-reference.cjs")],
                                        input=json.dumps(payload), capture_output=True, text=True, check=True, env=env)
                browser = json.loads(output.stdout)
                server = build_report(geojson, fields, TOKEN, language)
                server.pop("exportedAt")
                browser.pop("exportedAt")
                self.assertEqual(server, browser)


if __name__ == "__main__":
    unittest.main()
