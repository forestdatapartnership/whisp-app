"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { FeatureCollection } from "geojson";

const PlotMapView = dynamic(
  () => import("@/components/plots/plot-map-view").then((m) => m.PlotMapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-bg">
        <span className="text-[11px] tracking-[0.04em] text-text-dim">Loading map…</span>
      </div>
    ),
  }
);

interface MapPaneProps {
  visible: boolean;
  geoJsonData?: FeatureCollection | null;
  selectedFeatureIndex?: number;
  onFeatureClick?: (featureIndex: number) => void;
  className?: string;
}

export function MapPane({
  visible,
  geoJsonData,
  selectedFeatureIndex,
  onFeatureClick,
  className,
}: MapPaneProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex flex-col border-t border-border bg-[#0d1214] h-[300px] lg:h-auto lg:border-l lg:border-t-0 lg:flex-[0_0_44%]",
        visible ? "flex" : "hidden",
        className
      )}
    >
      <div className="relative flex flex-1 overflow-hidden">
        {geoJsonData ? (
          <PlotMapView
            geoJsonData={geoJsonData}
            selectedFeatureIndex={selectedFeatureIndex}
            onFeatureClick={onFeatureClick}
          />
        ) : (
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <span className="relative z-10 text-[11px] tracking-[0.04em] text-text-dim">
              No map data
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
