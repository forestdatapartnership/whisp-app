import ast
from importlib.metadata import PackageNotFoundError, distribution
import itertools
import json
from pathlib import Path
import tomllib
import unittest

ROOT = Path(__file__).resolve().parents[2]


class EngineSnapshotTests(unittest.TestCase):
    def test_display_rules_match_the_pinned_engine(self):
        try:
            engine = distribution("openforis-whisp")
        except PackageNotFoundError:
            self.skipTest("Install the pinned openforis-whisp distribution to check the display snapshot")
        dependencies = tomllib.loads((ROOT / "api/pyproject.toml").read_text())["project"]["dependencies"]
        pinned = next(item.split("==")[1] for item in dependencies if item.startswith("openforis-whisp=="))
        self.assertEqual(engine.version, pinned)

        # Read the data consumed by decision_tree_recipe without importing the package:
        # its __init__ otherwise attempts Earth Engine initialization and credentials access.
        source = Path(engine.locate_file("openforis_whisp/risk.py")).read_text()
        names = {"TIMBER_ROOT_TREE", "PCROP_ROOT_TREE", "ACROP_ROOT_TREE", "_CROP_LABELS", "_CROP_COLUMNS", "DECISION_TREES"}
        nodes = [node for node in ast.parse(source).body if (
            isinstance(node, ast.FunctionDef) and node.name == "_timber_leaf"
            or isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id in names for target in node.targets)
        )]
        namespace = {"__builtins__": {}}
        exec(compile(ast.Module(body=nodes, type_ignores=[]), "risk-tree-data", "exec"), namespace)
        snapshots = json.loads((ROOT / "app/src/lib/results/report-assets/risk-trees.json").read_text())
        for snapshot in snapshots:
            spec = namespace["DECISION_TREES"][snapshot["key"]]
            self.assertEqual(snapshot["riskField"], spec["risk_column"])

            def display_columns(tree):
                result = set()
                for rule in tree["rules"]:
                    result.update(rule["columns"])
                    if isinstance(rule["then"], dict):
                        result.update(display_columns(rule["then"]))
                return result

            def engine_columns(node):
                if "q" not in node:
                    return set()
                return set(spec["columns"][node["q"]]) | engine_columns(node["yes"]) | engine_columns(node["no"])

            columns = sorted(display_columns(snapshot["tree"]))
            self.assertEqual(set(columns), engine_columns(spec["tree"]))

            def display_risk(tree, row):
                for rule in tree["rules"]:
                    if any(row[key] for key in rule["columns"]) == (rule["is"] == "yes"):
                        return rule["then"] if isinstance(rule["then"], str) else display_risk(rule["then"], row)
                return tree["otherwise"]

            for flags in itertools.product((True, False), repeat=len(columns)):
                row = dict(zip(columns, flags))
                node = spec["tree"]
                while "q" in node:
                    side = "yes" if any(row[key] for key in spec["columns"][node["q"]]) else "no"
                    node = node[side]
                self.assertEqual(display_risk(snapshot["tree"], row), node["risk"], (snapshot["key"], row))


if __name__ == "__main__":
    unittest.main()
