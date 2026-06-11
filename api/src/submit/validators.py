import json
import re
from typing import Any

from shapely import wkt as shapely_wkt
from shapely.geometry import mapping

_VALID_CRS_TOKENS = (
    "urn:ogc:def:crs:ogc:1.3:crs84",
    "urn:ogc:def:crs:epsg::4326",
    "urn:ogc:def:crs:epsg:4326",
    "4326",
)
_WKT_DIMENSION = re.compile(r"\s+(Z|M|ZM)(?=\s*\()", re.IGNORECASE)


def validate_geojson_structure(obj: Any) -> list[str]:
    if not isinstance(obj, dict):
        return ["GeoJSON must be a JSON object"]
    t = obj.get("type")
    if t == "FeatureCollection":
        features = obj.get("features")
        if not isinstance(features, list):
            return ["FeatureCollection.features must be an array"]
        errors = []
        for i, feat in enumerate(features):
            errors.extend(_check_feature(feat, f"features[{i}]"))
        return errors
    if t == "Feature":
        return _check_feature(obj, "feature")
    if t in {"Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"}:
        return _check_geometry(obj, "geometry")
    return [f'Unsupported or missing "type": {t!r}']


def _check_feature(feat: Any, prefix: str) -> list[str]:
    if not isinstance(feat, dict):
        return [f"{prefix} must be an object"]
    errors = []
    if feat.get("type") != "Feature":
        errors.append(f'{prefix}.type must be "Feature"')
    geom = feat.get("geometry")
    if geom is not None:
        errors.extend(_check_geometry(geom, f"{prefix}.geometry"))
    return errors


def _check_geometry(geom: Any, prefix: str) -> list[str]:
    if not isinstance(geom, dict):
        return [f"{prefix} must be an object"]
    if "type" not in geom:
        return [f"{prefix}.type is missing"]
    if geom["type"] == "GeometryCollection":
        return [] if isinstance(geom.get("geometries"), list) else [f"{prefix}.geometries must be an array"]
    if "coordinates" not in geom:
        return [f"{prefix}.coordinates is missing"]
    return []


def validate_crs(geojson: dict) -> tuple[bool, str]:
    crs = geojson.get("crs") if isinstance(geojson, dict) else None
    if not crs:
        return True, ""
    if isinstance(crs, dict) and crs.get("type") == "name":
        name = str((crs.get("properties") or {}).get("name", "")).lower()
        if name and any(tok in name for tok in _VALID_CRS_TOKENS):
            return True, ""
        return False, f"Invalid CRS. Only EPSG:4326 is supported."
    return False, "Invalid CRS specification. Only EPSG:4326 is supported."


def _iter_coords(geom: Any):
    if not isinstance(geom, dict):
        return
    t, coords = geom.get("type"), geom.get("coordinates")
    if t == "Point" and isinstance(coords, list):
        yield coords
    elif t in {"LineString", "MultiPoint"} and isinstance(coords, list):
        yield from coords
    elif t in {"Polygon", "MultiLineString"} and isinstance(coords, list):
        for ring in coords:
            yield from (ring or [])
    elif t == "MultiPolygon" and isinstance(coords, list):
        for poly in coords:
            for ring in (poly or []):
                yield from (ring or [])
    elif t == "GeometryCollection":
        for sub in geom.get("geometries", []) or []:
            yield from _iter_coords(sub)
    elif t == "Feature":
        yield from _iter_coords(geom.get("geometry"))
    elif t == "FeatureCollection":
        for feat in geom.get("features", []) or []:
            yield from _iter_coords(feat.get("geometry") if isinstance(feat, dict) else None)


def is_valid_wgs84(geom: Any) -> bool:
    for c in _iter_coords(geom):
        if not isinstance(c, list) or len(c) < 2:
            return False
        lon, lat = c[0], c[1]
        if not (isinstance(lon, (int, float)) and isinstance(lat, (int, float))):
            return False
        if not (-180 <= lon <= 180 and -90 <= lat <= 90):
            return False
    return True


def coordinates_likely_in_meters(geom: Any) -> bool:
    for c in _iter_coords(geom):
        if isinstance(c, list) and len(c) >= 2:
            x, y = c[0], c[1]
            if isinstance(x, (int, float)) and isinstance(y, (int, float)):
                if abs(x) > 180 or abs(y) > 90:
                    return True
    return False


def _extract_features(node: Any, out: list[dict], props: dict | None = None) -> None:
    if not isinstance(node, dict):
        return
    t = node.get("type")
    p = props or {}
    if t == "Polygon":
        out.append({"type": "Feature", "properties": {**p}, "geometry": {
            "type": "Polygon",
            "coordinates": [[c[:2] for c in ring] for ring in node.get("coordinates", [])],
        }})
    elif t == "Point":
        out.append({"type": "Feature", "properties": {**p}, "geometry": {
            "type": "Point", "coordinates": (node.get("coordinates") or [])[:2],
        }})
    elif t == "MultiPoint":
        for pt in node.get("coordinates", []) or []:
            out.append({"type": "Feature", "properties": {**p}, "geometry": {"type": "Point", "coordinates": pt[:2]}})
    elif t == "MultiPolygon":
        for poly in node.get("coordinates", []) or []:
            out.append({"type": "Feature", "properties": {**p}, "geometry": {
                "type": "Polygon",
                "coordinates": [[c[:2] for c in ring] for ring in poly],
            }})
    elif t == "GeometryCollection":
        for sub in node.get("geometries", []) or []:
            _extract_features(sub, out, p)
    elif t == "Feature":
        _extract_features(node.get("geometry"), out, node.get("properties") or {})
    elif t == "FeatureCollection":
        for feat in node.get("features", []) or []:
            _extract_features(feat, out)


def to_feature_collection(geojson: Any) -> dict:
    features: list[dict] = []
    _extract_features(geojson, features)
    return {"type": "FeatureCollection", "features": features}


def get_common_property_names(fc: dict) -> list[str]:
    features = fc.get("features") if isinstance(fc, dict) else None
    if not isinstance(features, list):
        return []
    common: set[str] | None = None
    for feat in features:
        if not isinstance(feat, dict):
            continue
        props = list((feat.get("properties") or {}).keys())
        common = set(props) if common is None else common & set(props)
        if common is not None and not common:
            break
    return sorted(common or [])


def validate_external_id_column(fc: dict, column: str) -> bool:
    features = fc.get("features") if isinstance(fc, dict) else None
    if not isinstance(features, list) or not features:
        return False
    return all(isinstance(f, dict) and column in (f.get("properties") or {}) for f in features)


def wkt_to_geojson(wkt: str) -> dict | None:
    try:
        geom = shapely_wkt.loads(_WKT_DIMENSION.sub("", wkt))
    except Exception:
        return None
    # mapping() returns tuples; json round-trip coerces to lists
    return json.loads(json.dumps(mapping(geom)))


def wkt_to_feature_collection(wkt: str) -> dict | None:
    geom = wkt_to_geojson(wkt)
    if geom is None:
        return None
    fc = to_feature_collection(geom)
    return fc if fc.get("features") else None
