"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-dark.css";
import { useTheme } from "@/components/layout/theme-provider";
import { FeatureCollection, Feature, Geometry, GeoJsonProperties } from "geojson";
import { riskFromValue } from "@/components/results/risk-badge";
import { riskValueToTone } from "@/lib/results/catalog-fields";
import { COMMODITY_OPTIONS } from "@/lib/results/risk-trees";

const OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CARTO = `${OSM} &copy; <a href="https://carto.com/attributions">CARTO</a>`;

const BASE_TILES = {
  dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", attribution: CARTO },
  light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: CARTO },
} as const;

const RISK_FILL: Record<string, string> = {
  low: "#4c7e0b",
  medium: "#e09a1a",
  high: "#e05a5a",
  info: "#6b7280",
};

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!
  );
}

function popupHtml(props: Record<string, unknown>) {
  const rows: string[] = [];
  const push = (label: string, value: string) =>
    rows.push(`<div class="map-row"><span class="map-muted">${label}</span>${value}</div>`);

  if (props.plotId) push("Plot", esc(props.plotId));
  if (props.geoid) push("Geo ID", esc(props.geoid));
  for (const { riskField, label } of COMMODITY_OPTIONS) {
    const v = props[riskField];
    if (v == null || v === "") continue;
    const { level, label: riskLabel } = riskFromValue(v);
    push(
      label,
      `<span class="map-risk map-risk-${level}"><span class="map-risk-dot"></span>${esc(riskLabel)}</span>`
    );
  }
  return rows.length ? `<div class="map-popup">${rows.join("")}</div>` : "";
}

function riskColor(props: GeoJsonProperties | null | undefined, riskField?: string) {
  if (!riskField || !props) return RISK_FILL.info;
  const tone = riskValueToTone(String(props[riskField] ?? "")) ?? "info";
  return RISK_FILL[tone];
}

interface PlotMapViewProps {
  geoJsonData: FeatureCollection;
  selectedFeatureIndex?: number;
  riskField?: string;
  onFeatureClick?: (featureIndex: number) => void;
}

function MapController({
  geoJsonData,
  selectedFeatureIndex,
}: {
  geoJsonData: FeatureCollection;
  selectedFeatureIndex?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (geoJsonData.features.length === 0) return;
    const bounds = L.geoJSON(geoJsonData).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
  }, [geoJsonData, map]);

  useEffect(() => {
    const feature =
      selectedFeatureIndex != null && selectedFeatureIndex >= 0
        ? geoJsonData.features[selectedFeatureIndex]
        : undefined;
    if (!feature) {
      map.closePopup();
      return;
    }
    if (feature.geometry.type === "Point") {
      const [lng, lat] = feature.geometry.coordinates;
      map.setView([lat, lng], 15);
      return;
    }
    if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
      const bounds = L.geoJSON(feature).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [selectedFeatureIndex, geoJsonData, map]);

  return null;
}

export function PlotMapView({
  geoJsonData,
  selectedFeatureIndex,
  riskField,
  onFeatureClick,
}: PlotMapViewProps) {
  const { theme } = useTheme();
  const baseTile = BASE_TILES[theme];
  const selectedPlotId =
    selectedFeatureIndex != null && selectedFeatureIndex >= 0
      ? geoJsonData.features[selectedFeatureIndex]?.properties?.plotId
      : undefined;

  const onEachFeature = (feature: Feature<Geometry, GeoJsonProperties>, layer: L.Layer) => {
    layer.on({
      click: () => {
        if (!onFeatureClick) return;
        const plotId = feature.properties?.plotId;
        const i = geoJsonData.features.findIndex((f) => f.properties?.plotId === plotId);
        if (i !== -1) onFeatureClick(i);
      },
    });
    const html = feature.properties && popupHtml(feature.properties);
    if (html) layer.bindPopup(html);
  };

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[0, 20]}
        zoom={5}
        className="h-full w-full"
        attributionControl
        scrollWheelZoom
      >
        <MapController geoJsonData={geoJsonData} selectedFeatureIndex={selectedFeatureIndex} />
        <LayersControl key={theme} position="topright">
          <LayersControl.BaseLayer checked name={theme === "dark" ? "Dark Map" : "Light Map"}>
            <TileLayer url={baseTile.url} attribution={baseTile.attribution} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              maxZoom={18}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street Map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution={OSM}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <GeoJSON
          key={`${riskField ?? "none"}-${geoJsonData.features.length}-${String(selectedPlotId ?? "")}`}
          data={geoJsonData}
          style={(feature) => {
            const selected = feature?.properties?.plotId === selectedPlotId;
            const fill = riskColor(feature?.properties, riskField);
            return {
              fillColor: fill,
              color: selected ? "#ffffff" : fill,
              weight: selected ? 3 : 1.5,
              opacity: 1,
              fillOpacity: selected ? 0.85 : 0.55,
            };
          }}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
