"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-dark.css";
import { BaseLayers } from "./base-layers";
import { FeatureCollection, Feature, Geometry, GeoJsonProperties } from "geojson";
import { riskLevel, useRiskLabel } from "@/components/results/risk-badge";
import { COMMODITY_OPTIONS } from "@/lib/results/risk-trees";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
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

function riskColor(props: GeoJsonProperties | null | undefined, riskField?: string) {
  if (!riskField || !props) return "var(--text-muted)";
  const level = riskLevel(props[riskField]);
  return level === "info" ? "var(--text-muted)" : `var(--risk-${level})`;
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
  const t = useTranslations("Results");
  const riskLabel = useRiskLabel();

  const popupHtml = (props: Record<string, unknown>) => {
    const rows: string[] = [];
    const push = (label: string, value: string) =>
      rows.push(`<div class="map-row"><span class="map-muted">${label}</span>${value}</div>`);

    if (props.plotId) push(t("mapPlot"), esc(props.plotId));
    if (props.geoid) push(t("mapGeoId"), esc(props.geoid));
    for (const { key, riskField } of COMMODITY_OPTIONS) {
      const v = props[riskField];
      if (v == null || v === "") continue;
      const { level, label } = riskLabel(v);
      push(
        t(`commodity.${key}`),
        `<span class="map-risk map-risk-${level}"><span class="map-risk-dot"></span>${esc(label)}</span>`
      );
    }
    return rows.length ? `<div class="map-popup">${rows.join("")}</div>` : "";
  };

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
        <BaseLayers />
        <GeoJSON
          key={`${riskField ?? "none"}-${geoJsonData.features.length}-${String(selectedPlotId ?? "")}`}
          data={geoJsonData}
          style={(feature) => {
            const selected = feature?.properties?.plotId === selectedPlotId;
            const fill = riskColor(feature?.properties, riskField);
            return {
              fillColor: fill,
              color: selected ? "var(--text-primary)" : fill,
              weight: selected ? 4 : 2,
              opacity: 1,
              fillOpacity: selected ? 0.82 : 0.62,
            };
          }}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
