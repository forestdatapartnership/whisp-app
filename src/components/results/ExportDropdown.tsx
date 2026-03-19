"use client"

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { downloadCsv, timestampFilename } from "@/lib/utils/downloadCsv";
import { geojsonToServerCsvFormat } from "@/lib/utils/geojsonToCsv";
import { useDataTable } from "@/components/data-table/DataTableContext";
import type { FeatureCollection } from "geojson";
import type { RecordData } from "@/lib/utils/geojsonUtils";

interface ExportDropdownProps {
  isDisabled?: boolean;
  tableData: RecordData[];
  geoJsonData: FeatureCollection | null;
}

export function ExportDropdown({
  isDisabled = false,
  tableData,
  geoJsonData,
}: ExportDropdownProps) {
  const table = useDataTable<RecordData>();
  const [open, setOpen] = useState(false);

  const visibleCols = useMemo(
    () =>
      table
        .getVisibleLeafColumns()
        .filter((c) => typeof c.accessorFn !== "undefined" && c.id !== "geojson")
        .map((c) => c.id),
    [table]
  );

  const canDownloadAll = !!geoJsonData?.features?.length;
  const canDownloadVisible = canDownloadAll && tableData.length > 0 && visibleCols.length > 0;

  const downloadBlob = useCallback((blob: Blob, ext: string, suffix?: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = timestampFilename(ext, suffix);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setOpen(false);
  }, []);

  const handleDownloadCsvVisible = () => {
    if (visibleCols.length === 0 || !tableData.length) return;
    const rows = tableData.map((row) => visibleCols.map((col) => row[col] ?? ""));
    downloadCsv(visibleCols, rows, timestampFilename("csv", "api-sel"));
    setOpen(false);
  };

  const handleDownloadCsvAll = () => {
    if (!geoJsonData?.features?.length) return;
    const { header, rows } = geojsonToServerCsvFormat(geoJsonData);
    if (!header.length) return;
    downloadCsv(header, rows, timestampFilename("csv", "api"));
    setOpen(false);
  };

  const handleDownloadGeoJsonVisible = () => {
    if (visibleCols.length === 0 || !geoJsonData?.features) return;
    const filteredFeatures = geoJsonData.features.map((f) => ({
      ...f,
      properties: visibleCols.reduce(
        (acc, col) => {
          if (f.properties && col in f.properties) acc[col] = f.properties[col];
          return acc;
        },
        {} as Record<string, unknown>
      ),
    }));
    const filtered: FeatureCollection & { name?: unknown } = {
      type: "FeatureCollection",
      features: filteredFeatures,
    };
    const src = geoJsonData as { name?: unknown };
    if (src.name) filtered.name = src.name;
    downloadBlob(new Blob([JSON.stringify(filtered, null, 2)], { type: "application/geo+json" }), "geojson", "api-sel");
  };

  const handleDownloadGeoJsonAll = () => {
    if (!geoJsonData?.features) return;
    downloadBlob(new Blob([JSON.stringify(geoJsonData, null, 2)], { type: "application/geo+json" }), "geojson", "api");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDisabled}
          className="h-8"
        >
          Export
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onClick={handleDownloadCsvVisible} disabled={isDisabled || !canDownloadVisible} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export CSV (selected fields)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadCsvAll} disabled={isDisabled || !canDownloadAll} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export CSV (all fields)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDownloadGeoJsonVisible} disabled={!canDownloadVisible} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export GeoJSON (selected fields)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadGeoJsonAll} disabled={!canDownloadAll} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export GeoJSON (all fields)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
