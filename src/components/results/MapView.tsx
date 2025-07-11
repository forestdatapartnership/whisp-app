'use client'

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FeatureCollection, Feature, Geometry, GeoJsonProperties } from 'geojson';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  geoJsonData: FeatureCollection;
  selectedFeatureIndex?: number;
  onFeatureClick?: (featureIndex: number) => void;
}

const MapView: React.FC<MapViewProps> = ({ geoJsonData, selectedFeatureIndex, onFeatureClick }) => {
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  // Get Google Maps API key from environment
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      setGoogleMapsApiKey(apiKey);
    }
  }, []);

  // Center map on selected feature
  useEffect(() => {
    if (mapRef.current && selectedFeatureIndex !== undefined && geoJsonData.features[selectedFeatureIndex]) {
      const feature = geoJsonData.features[selectedFeatureIndex];
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = (feature.geometry as any).coordinates;
        mapRef.current.setView([lat, lng], 15);
      } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        const geoJsonLayer = L.geoJSON(feature);
        const bounds = geoJsonLayer.getBounds();
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [selectedFeatureIndex, geoJsonData]);

  const onEachFeature = (feature: Feature<Geometry, GeoJsonProperties>, layer: L.Layer) => {
    layer.on({
      click: () => {
        const featureIndex = geoJsonData.features.findIndex(f => f === feature);
        if (onFeatureClick && featureIndex !== -1) {
          onFeatureClick(featureIndex);
        }
      }
    });

    // Add popup with plotId and risk* properties
    if (feature.properties) {
      const popupItems: string[] = [];
      
      // Add Plot Id if it exists
      if (feature.properties.plotId) {
        popupItems.push(`<strong>Plot Id:</strong> ${feature.properties.plotId}`);
      }
      
      // Add risk properties
      const riskProperties = Object.entries(feature.properties)
        .filter(([key, value]) => 
          key.toLowerCase().startsWith('risk') && 
          value !== null && 
          value !== undefined
        );
      
      riskProperties.forEach(([key, value]) => {
        popupItems.push(`<strong>${key}:</strong> ${value}`);
      });
      
      if (popupItems.length > 0) {
        const popupContent = popupItems.join('<br>');
        layer.bindPopup(popupContent);
      }
    }
  };

  const geoJsonStyle = (feature?: Feature<Geometry, GeoJsonProperties>) => {
    const featureIndex = feature ? geoJsonData.features.findIndex(f => f === feature) : -1;
    const isSelected = featureIndex === selectedFeatureIndex;
    
    return {
      fillColor: isSelected ? '#ff7800' : '#3388ff',
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: isSelected ? '#ff7800' : '#3388ff',
      dashArray: '',
      fillOpacity: 0.7
    };
  };

  // Calculate initial bounds
  const getBounds = () => {
    if (geoJsonData.features.length === 0) return undefined;
    
    const geoJsonLayer = L.geoJSON(geoJsonData);
    return geoJsonLayer.getBounds();
  };

  const bounds = getBounds();

  return (
    <div className="h-full w-full">
      <MapContainer
        ref={mapRef}
        bounds={bounds}
        className="h-full w-full rounded-lg"
        style={{ backgroundColor: '#1f2937' }}
        attributionControl={true}
      >
        <LayersControl position="topright">
          {/* Dark mode tile layer */}
          <LayersControl.BaseLayer checked name="Dark Map">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          </LayersControl.BaseLayer>

          {/* Google Satellite layer with API key */}
          {googleMapsApiKey ? (
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                url={`https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${googleMapsApiKey}`}
                attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                maxZoom={20}
              />
            </LayersControl.BaseLayer>
          ) : (
            // Fallback satellite layer without API key (limited usage)
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                maxZoom={18}
              />
            </LayersControl.BaseLayer>
          )}

          {/* Street Map layer */}
          <LayersControl.BaseLayer name="Street Map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <GeoJSON
          ref={geoJsonLayerRef}
          data={geoJsonData}
          style={geoJsonStyle}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
};

export default MapView;