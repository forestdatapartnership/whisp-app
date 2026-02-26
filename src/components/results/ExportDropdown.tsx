"use client"

import React, { useState } from 'react';
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
import type { Table } from "@tanstack/react-table";
import type { FeatureCollection } from "geojson";
import type { RecordData } from "@/lib/utils/geojsonUtils";

interface ExportDropdownProps {
  isDisabled?: boolean;
  table: Table<RecordData>;
  tableData: RecordData[];
  geoJsonData: FeatureCollection | null;
}

export function ExportDropdown({
  isDisabled = false,
  table,
  tableData,
  geoJsonData,
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);

  const visibleCols = () =>
    table
      .getVisibleLeafColumns()
      .filter((c) => typeof c.accessorFn !== "undefined" && c.id !== "geojson")
      .map((c) => c.id);

  const canDownloadAll = !!geoJsonData?.features?.length;
  const canDownloadVisible = canDownloadAll && tableData.length > 0 && visibleCols().length > 0;

  const handleDownloadCsvVisible = () => {
    const cols = visibleCols();
    if (cols.length === 0 || !tableData.length) return;
    const rows = tableData.map((row) => cols.map((col) => row[col] ?? ""));
    downloadCsv(cols, rows, timestampFilename("csv"));
    setOpen(false);
  };

  const handleDownloadCsvAll = () => {
    if (!geoJsonData?.features?.length) return;
    const { header, rows } = geojsonToServerCsvFormat(geoJsonData);
    if (!header.length) return;
    downloadCsv(header, rows, timestampFilename("csv"));
    setOpen(false);
  };

  const handleDownloadGeoJsonVisible = () => {
    const cols = visibleCols();
    if (cols.length === 0 || !geoJsonData?.features) return;
    const filteredFeatures = geoJsonData.features.map((f) => ({
      ...f,
      properties: cols.reduce(
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
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/geo+json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = timestampFilename("geojson");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setOpen(false);
  };

  const handleDownloadGeoJsonAll = () => {
    if (!geoJsonData?.features) return;
    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: "application/geo+json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = timestampFilename("geojson");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setOpen(false);
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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleDownloadCsvVisible} disabled={isDisabled || !canDownloadVisible} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export CSV (visible fields)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadCsvAll} disabled={isDisabled || !canDownloadAll} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export CSV (all fields)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDownloadGeoJsonVisible} disabled={!canDownloadVisible} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export GeoJSON (visible fields)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadGeoJsonAll} disabled={!canDownloadAll} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export GeoJSON (all fields)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
