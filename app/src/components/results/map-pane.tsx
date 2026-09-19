"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { FeatureCollection } from "geojson";

function MapLoading() {
  const t = useTranslations("Results");
  return (
    <div className="flex h-full w-full items-center justify-center bg-bg">
      <span className="text-[11px] tracking-[0.04em] text-text-dim">{t("loadingMap")}</span>
    </div>
  );
}

const PlotMapView = dynamic(
  () => import("@/components/plots/plot-map-view").then((m) => m.PlotMapView),
  { ssr: false, loading: MapLoading }
);

interface MapPaneProps {
  visible: boolean;
  geoJsonData?: FeatureCollection | null;
  selectedFeatureIndex?: number;
  riskField?: string;
  onFeatureClick?: (featureIndex: number) => void;
  className?: string;
}

export function MapPane({
  visible,
  geoJsonData,
  selectedFeatureIndex,
  riskField,
  onFeatureClick,
  className,
}: MapPaneProps) {
  const t = useTranslations("Results");
  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex h-[300px] flex-col border-t border-border bg-bg lg:h-auto lg:flex-[0_0_44%] lg:border-l lg:border-t-0",
        className
      )}
    >
      <div className="relative flex flex-1 overflow-hidden">
        {geoJsonData ? (
          <PlotMapView
            geoJsonData={geoJsonData}
            selectedFeatureIndex={selectedFeatureIndex}
            riskField={riskField}
            onFeatureClick={onFeatureClick}
          />
        ) : (
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <span className="text-[11px] tracking-[0.04em] text-text-dim">{t("noMapData")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
