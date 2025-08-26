"use client"

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";
import { useStore } from "@/store";

interface DownloadDropdownProps {
  token?: string;
  id: string;
  isDisabled?: boolean;
}

export function DownloadDropdown({ 
  token, 
  id, 
  isDisabled = false 
}: DownloadDropdownProps) {
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCsv = async () => {
    if (isDisabled) return;

    setIsDownloading(true);
    try {
      const csvUrl = `/api/download-csv/${token || id}`;
      const response = await fetch(csvUrl);

      if (!response.ok) {
        throw new Error(`Failed to download CSV: ${response.statusText}`);
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${token || id}.csv`; // fallback filename
      
      if (contentDisposition) {
        // First try to parse the simple filename= format
        const simpleFilenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (simpleFilenameMatch && simpleFilenameMatch[1]) {
          filename = simpleFilenameMatch[1];
        } else {
          // Fallback to RFC 5987 format (filename*=UTF-8'')
          const rfc5987Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
          if (rfc5987Match && rfc5987Match[1]) {
            filename = decodeURIComponent(rfc5987Match[1]);
          }
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download failed:', error);
      useStore.setState({ error: error.message });
    } finally {
      setIsDownloading(false);
      setOpen(false);
    }
  };

  const handleDownloadGeoJson = async () => {
    setIsDownloading(true);
    try {
      const geoJsonUrl = `/api/generate-geojson/${token || id}`;
      const response = await fetch(geoJsonUrl);

      if (!response.ok) {
        throw new Error(`Failed to download GeoJSON: ${response.statusText}`);
      }

      const geoJsonData = await response.json();
      
      // Generate timestamp for filename
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const filename = `whisp_analysis_${year}_${month}_${day}_${hours}_${minutes}.geojson`;

      const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { 
        type: 'application/geo+json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('GeoJSON download failed:', error);
      useStore.setState({ error: error.message });
    } finally {
      setIsDownloading(false);
      setOpen(false);
    }
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
          onClick={handleDownloadCsv}
          disabled={isDisabled || isDownloading}
          className="cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDownloadGeoJson}
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