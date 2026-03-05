"use client"

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { MixerHorizontalIcon } from "@radix-ui/react-icons"
import React from "react"
import { useDataTable } from "@/components/data-table/DataTableContext"

import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu"

export function AnalysisColumnToggle() {
  const table = useDataTable();
  const [columnToggleOpen, setColumnToggleOpen] = React.useState(false);

  const toggleableColumns = React.useMemo(
    () =>
      table.getAllColumns().filter(
        (column) =>
          typeof column.accessorFn !== "undefined" &&
          column.getCanHide() &&
          column.id !== 'geojson'
      ),
    [table]
  );

  const hasRiskColumns = React.useMemo(
    () =>
      toggleableColumns.some((c) => {
        const meta = c.columnDef.meta as { cropMetadata?: Record<string, unknown> } | undefined;
        return meta?.cropMetadata && Object.keys(meta.cropMetadata).length > 0;
      }),
    [toggleableColumns]
  );

  const toggleAll = (visibility: boolean) => {
    toggleableColumns.forEach(c => c.toggleVisibility(visibility));
  };

  const showRiskColumnsOnly = () => {
    toggleableColumns.forEach((c) => {
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
    <DropdownMenu open={columnToggleOpen} onOpenChange={setColumnToggleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          Toggle fields
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] h-[400px] overflow-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => toggleAll(false)}>
            Select None
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => toggleAll(true)}>
            Select All
          </Button>
          {hasRiskColumns && (
            <Button variant="outline" size="sm" className="h-8" onClick={showRiskColumnsOnly}>
              Risk fields only
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {toggleableColumns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="uppercase"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => {
                column.toggleVisibility(!!value);
                return false;
              }}
              onSelect={(e) => e.preventDefault()}
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
