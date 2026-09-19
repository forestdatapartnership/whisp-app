"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface ResultsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalRows: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  className?: string;
}

export function ResultsPagination({
  currentPage,
  totalPages,
  totalRows,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  className,
}: ResultsPaginationProps) {
  const t = useTranslations("Common");
  const startRow = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, totalRows);

  return (
    <div
      className={cn(
        "grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border bg-surface px-[14px] py-2 text-xs text-text-muted",
        className
      )}
    >
      <div className="flex items-center gap-[6px]">
        <span>{t('rows')}</span>
        <Select
          value={String(rowsPerPage)}
          onValueChange={(v) => onRowsPerPageChange(Number(v))}
        >
          <SelectTrigger size="sm" className="w-[60px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <span className="whitespace-nowrap">
        {t('pageOf', { page: currentPage, total: totalPages })}
      </span>
      <div className="flex items-center justify-end gap-2">
        <span className="whitespace-nowrap">
          {t('range', { from: startRow, to: endRow, total: totalRows })}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          aria-label={t('firstPage')}
          title={t('firstPage')}
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label={t('previousPage')}
          title={t('previousPage')}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label={t('nextPage')}
          title={t('nextPage')}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          aria-label={t('lastPage')}
          title={t('lastPage')}
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}
