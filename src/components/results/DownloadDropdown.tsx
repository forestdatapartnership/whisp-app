"use client"

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";

interface DownloadDropdownProps {
  onDownloadCsv: () => void;
  onDownloadGeoJson: () => void;
  isDisabled?: boolean;
  isDownloading?: boolean;
}

export function DownloadDropdown({ 
  onDownloadCsv, 
  onDownloadGeoJson, 
  isDisabled = false, 
  isDownloading = false 
}: DownloadDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleCsvDownload = () => {
    onDownloadCsv();
    setOpen(false);
  };

  const handleGeoJsonDownload = () => {
    onDownloadGeoJson();
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isDisabled || isDownloading}
          className={`w-full text-white font-bold py-1 px-2 text-sm rounded ${
            isDisabled 
              ? 'bg-yellow-300' 
              : isDownloading 
              ? 'bg-yellow-400' 
              : 'bg-yellow-500 hover:bg-yellow-700'
          } flex items-center justify-center`}
        >
          <span className="flex-1">
            {isDownloading ? 'Downloading...' : 'Download'}
          </span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleCsvDownload}
          disabled={isDisabled || isDownloading}
          className="cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleGeoJsonDownload}
          disabled={isDisabled || isDownloading}
          className="cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download GeoJSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}