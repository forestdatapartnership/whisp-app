"use client"

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { MixerHorizontalIcon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import React from "react"

import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu"
import { ExportDropdown } from "./ExportDropdown"
import type { RecordData } from "@/lib/utils/geojsonUtils"
import type { FeatureCollection } from "geojson"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
  tableData: RecordData[]
  geoJsonData: FeatureCollection | null
}

export function DataTableViewOptions<TData>({
  table,
  tableData,
  geoJsonData,
}: DataTableViewOptionsProps<TData>) {
  const [open, setOpen] = React.useState(false);
  
  const toggleAll = (visibility: boolean) => {
      table.getAllColumns().filter(
        (column) =>
          typeof column.accessorFn !== "undefined" && 
          column.getCanHide() && 
          column.id !== 'geojson'
      ).forEach(c=>c.toggleVisibility(visibility));
  };

  const showRiskColumnsOnly = () => {
    const cols = table.getAllColumns().filter(
      (column) =>
        typeof column.accessorFn !== "undefined" &&
        column.getCanHide() &&
        column.id !== 'geojson'
    );
    cols.forEach((c) => {
      const meta = c.columnDef.meta as {
        category?: string;
        cropMetadata?: Record<string, { usedForRisk?: boolean | null }>;
      } | undefined;
      const usedForRisk = Object.values(meta?.cropMetadata ?? {}).some((m) => m?.usedForRisk === true);
      const categoryMatch = meta?.category === 'Context and metadata' || meta?.category === 'Analysis results' || meta?.category === 'Plot location';
      c.toggleVisibility(usedForRisk || categoryMatch);
    });
  };
  
  return (
    <div className="flex gap-2 items-center">
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          Toggle fields
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] h-[400px] overflow-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex" onClick={() => toggleAll(false)}>
            Select None
            </Button>
            <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex" onClick={() => toggleAll(true)}>
            Select All
            </Button>
            <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex" onClick={showRiskColumnsOnly}>
            Risk fields only
            </Button>
            <div className="flex-1 text-sm text-muted-foreground">
            </div>
        </div>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="uppercase"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => {
                  column.toggleVisibility(!!value);
                  // Stop event propagation to prevent dropdown from closing
                  return false;
                }}
                // Prevent the dropdown from closing when clicking the item
                onSelect={(e) => e.preventDefault()}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
    <ExportDropdown
      table={table as Table<RecordData>}
      tableData={tableData}
      geoJsonData={geoJsonData}
    />
    </div>
  )
}
