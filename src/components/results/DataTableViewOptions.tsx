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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const [open, setOpen] = React.useState(false);
  
  const toggleAll = (visibility: boolean) => {
      table.getAllColumns().filter(
        (column) =>
          typeof column.accessorFn !== "undefined" && 
          column.getCanHide() && 
          // Exclude columns that might contain GeoJSON objects
          column.id !== 'geojson'
      ).forEach(c=>c.toggleVisibility(visibility));
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          Toggle columns
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
  )
}
