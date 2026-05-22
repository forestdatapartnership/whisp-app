"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-dark.css";
import { useTheme } from "@/components/layout/theme-provider";
import { FeatureCollection, Feature, Geometry, GeoJsonProperties } from "geojson";

const BASE_TILES = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
} as const;

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface PlotMapViewProps {
  geoJsonData: FeatureCollection;
  selectedFeatureIndex?: number;
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
    const layer = L.geoJSON(geoJsonData);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [geoJsonData, map]);

  useEffect(() => {
    if (selectedFeatureIndex === undefined || !geoJsonData.features[selectedFeatureIndex]) return;
    const feature = geoJsonData.features[selectedFeatureIndex];
    if (feature.geometry.type === "Point") {
      const [lng, lat] = (feature.geometry as any).coordinates;
      map.setView([lat, lng], 15);
    } else if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
      const layer = L.geoJSON(feature);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [selectedFeatureIndex, geoJsonData, map]);

  return null;
}

export function PlotMapView({ geoJsonData, selectedFeatureIndex, onFeatureClick }: PlotMapViewProps) {
  const { theme } = useTheme();
  const baseTile = BASE_TILES[theme];
  const onEachFeature = (feature: Feature<Geometry, GeoJsonProperties>, layer: L.Layer) => {
    layer.on({
      click: () => {
        const plotId = feature.properties?.plotId;
        const featureIndex = geoJsonData.features.findIndex((f) => f.properties?.plotId === plotId);
        if (onFeatureClick && featureIndex !== -1) {
          onFeatureClick(featureIndex);
        }
      },
    });

    if (feature.properties) {
      const popupItems: string[] = [];

      if (feature.properties.plotId) {
        popupItems.push(`<strong>Plot Id:</strong> ${feature.properties.plotId}`);
      }

      if (feature.properties.geoid) {
        popupItems.push(`<strong>Geo Id:</strong> ${feature.properties.geoid}`);
      }

      const riskProperties = Object.entries(feature.properties).filter(
        ([key, value]) => key.toLowerCase().startsWith("risk") && value !== null && value !== undefined
      );

      riskProperties.forEach(([key, value]) => {
        popupItems.push(`<strong>${key}:</strong> ${value}`);
      });

      if (popupItems.length > 0) {
        const popupContent = popupItems.join("<br>");
        layer.bindPopup(popupContent);
      }
    }
  };

  const geoJsonStyle = (feature?: Feature<Geometry, GeoJsonProperties>) => {
    const plotId = feature?.properties?.plotId;
    const featureIndex = geoJsonData.features.findIndex((f) => f.properties?.plotId === plotId);
    const isSelected = featureIndex === selectedFeatureIndex;

    return {
      fillColor: isSelected ? "#ff7800" : "#3388ff",
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: isSelected ? "#ff7800" : "#3388ff",
      dashArray: "",
      fillOpacity: 0.7,
    };
  };

  const defaultCenter: [number, number] = [0, 20];
  const defaultZoom = 5;

  return (
    <div className="h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        attributionControl={true}
        scrollWheelZoom={true}
      >
        <MapController geoJsonData={geoJsonData} selectedFeatureIndex={selectedFeatureIndex} />
        <LayersControl key={theme} position="topright">
          <LayersControl.BaseLayer
            checked
            name={theme === "dark" ? "Dark Map" : "Light Map"}
          >
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <GeoJSON data={geoJsonData} style={geoJsonStyle} onEachFeature={onEachFeature} />
      </MapContainer>
    </div>
  );
}
