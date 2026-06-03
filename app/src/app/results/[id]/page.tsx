"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { AnalysisProgress } from "@/components/results/analysis-progress";
import { ResultsToolbar } from "@/components/results/results-toolbar";
import { ResultsSearchBar } from "@/components/results/results-search-bar";
import { ResultsTable, type ColumnDef, type ResultRow } from "@/components/results/results-table";
import { ResultsPagination } from "@/components/results/results-pagination";
import { MapPane } from "@/components/results/map-pane";
import { FieldPicker, type ColumnGroup } from "@/components/results/field-picker";
import { useConfig } from "@/lib/config/config-context";
import { useJobStatus } from "@/lib/submission/useJobStatus";
import { readSyncResult } from "@/lib/submission/sync-result";
import { downloadCsv, downloadGeoJson, timestampFilename } from "@/lib/utils/export";
import { Button } from "@/components/ui/button";
import { getResultFields } from "@/app/docs/reference/result-fields/actions";
import type { ResultField } from "@/types/models";
import type { FeatureCollection } from "geojson";

function buildFromFields(fields: ResultField[]) {
  const visible = fields.filter(
    (f) => f.displayMetadata?.excludeFromResults !== true && f.analysisMetadata?.excludeFromOutput !== true
  );
  const sorted = [...visible].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

  const allColumns: ColumnDef[] = sorted.map((f) => ({
    key: f.id,
    header: f.displayMetadata?.displayName ?? f.id,
    type: f.type,
    category: f.category,
    commodityMetadata: f.commodityMetadata,
  }));

  const categoryMap = new Map<string, string[]>();
  for (const f of sorted) {
    const cat = f.category ?? "Other";
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(f.id);
  }
  const columnGroups: ColumnGroup[] = [...categoryMap.entries()].map(([name, columns]) => ({ name, columns }));

  const defaultVisible = sorted
    .filter((f) => f.displayMetadata?.visibleByDefault !== false)
    .map((f) => f.id);

  return { allColumns, columnGroups, defaultVisible };
}

function featuresToRows(fc: FeatureCollection): ResultRow[] {
  return (fc.features ?? []).map((f) => {
    const props = (f.properties ?? {}) as Record<string, unknown>;
    return { ...props, geo: f.geometry } as ResultRow;
  });
}

function compareResultValues(
  a: unknown,
  b: unknown,
  columnKey: string,
  columnType?: string
): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (columnType === "numeric" || columnKey.toLowerCase() === "plotid") {
    const an = typeof a === "number" ? a : Number(a);
    const bn = typeof b === "number" ? b : Number(b);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
  }

  const as = String(a).toLowerCase();
  const bs = String(b).toLowerCase();
  if (as < bs) return -1;
  if (as > bs) return 1;
  return 0;
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { config } = useConfig();

  const [mapVisible, setMapVisible] = useState(true);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRow, setSelectedRow] = useState<ResultRow | null>(null);
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [allColumns, setAllColumns] = useState<ColumnDef[]>([]);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([]);
  const [visibleCols, setVisibleCols] = useState<string[]>([]);
  const [defaultVisibleCols, setDefaultVisibleCols] = useState<string[]>([]);
  const [tableData, setTableData] = useState<ResultRow[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    getResultFields().then((result) => {
      if (!result.ok) return;
      const built = buildFromFields(result.data);
      setAllColumns(built.allColumns);
      setColumnGroups(built.columnGroups);
      setVisibleCols(built.defaultVisible);
      setDefaultVisibleCols(built.defaultVisible);
    });
  }, []);

  const handleCompleted = useCallback((data: unknown) => {
    const fc = data as FeatureCollection;
    if (fc?.type === "FeatureCollection" && Array.isArray(fc.features)) {
      setTableData(featuresToRows(fc));
      setGeoJsonData(fc);
    }
  }, []);

  useEffect(() => {
    const sync = readSyncResult(id);
    if (sync) handleCompleted(sync);
  }, [id, handleCompleted]);

  const { response, isLoading, error } = useJobStatus({ token: id, onCompleted: handleCompleted });

  const code = response?.code;
  const isProcessing = isLoading || code === 'analysis_processing' || code === 'analysis_queued';
  const isError = !!error || (code && code !== 'analysis_completed' && code !== 'analysis_processing' && code !== 'analysis_queued');

  const columns = useMemo(() => {
    return allColumns.map((c) => ({
      ...c,
      hidden: !visibleCols.includes(c.key),
    }));
  }, [allColumns, visibleCols]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return tableData;
    const q = search.toLowerCase();
    const searchKeys = ["plotId", "external_id", "Country", "Admin_Level_1"] as const;
    return tableData.filter((row) =>
      searchKeys.some((key) =>
        String(row[key] ?? "").toLowerCase().includes(q)
      )
    );
  }, [search, tableData]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const columnType = allColumns.find((c) => c.key === sortColumn)?.type;
    return [...filteredData].sort((a, b) => {
      const cmp = compareResultValues(
        a[sortColumn],
        b[sortColumn],
        sortColumn,
        columnType
      );
      return sortAsc ? cmp : -cmp;
    });
  }, [filteredData, sortColumn, sortAsc, allColumns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const pageData = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, safePage, rowsPerPage]);

  const handleSort = useCallback((key: string) => {
    setCurrentPage(1);
    if (sortColumn === key) {
      setSortAsc((asc) => !asc);
    } else {
      setSortColumn(key);
      setSortAsc(true);
    }
  }, [sortColumn]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleRowsPerPageChange = useCallback((rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  }, []);

  const handleOpenWhispMap = useCallback(() => {
    if (tableData.length === 0 || !config?.api.url) return;
    const downloadUrl = `${config.api.url}/generate-geojson/${id}`;
    window.open(
      `https://whisp.earthmap.org/?aoi=WHISP&fetchJson=${encodeURIComponent(downloadUrl)}`,
      "_blank"
    );
  }, [id, tableData.length, config?.api.url]);

  const handleExport = (format: string) => {
    if (!geoJsonData) return;
    const cols = visibleCols.length ? visibleCols : allColumns.map((c) => c.key);
    if (format === "csv") {
      const rows = tableData.map((row) => {
        const out: Record<string, unknown> = {};
        for (const c of cols) out[c] = row[c];
        return out;
      });
      downloadCsv(cols, rows, timestampFilename("csv"));
    } else if (format === "geojson") {
      const filtered: FeatureCollection = {
        type: "FeatureCollection",
        features: geoJsonData.features.map((f) => ({
          ...f,
          properties: Object.fromEntries(
            cols.map((c) => [c, f.properties?.[c]]).filter(([, v]) => v !== undefined)
          ),
        })),
      };
      downloadGeoJson(filtered, timestampFilename("geojson"));
    }
  };

  const selectedFeatureIndex = useMemo(() => {
    if (!selectedRow || !geoJsonData) return undefined;
    return geoJsonData.features.findIndex((f) => f.properties?.plotId === selectedRow.plotId);
  }, [selectedRow, geoJsonData]);

  const handleFeatureClick = useCallback(
    (featureIndex: number) => {
      if (!geoJsonData) return;
      const plotId = geoJsonData.features[featureIndex]?.properties?.plotId;
      if (plotId) setSelectedRow(filteredData.find((r) => r.plotId === plotId) || null);
    },
    [geoJsonData, filteredData]
  );

  if (isProcessing) {
    const featureCount = response?.data?.featureCount as number | undefined;
    const percent = response?.data?.percent as number | undefined;
    const processStatusMessages = response?.data?.processStatusMessages as string[] | undefined;
    return (
      <AnalysisProgress
        featureCount={featureCount}
        percent={percent}
        messages={processStatusMessages}
      />
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <AlertTriangle className="size-8 text-red-400" />
          <p className="text-sm">{response?.message ?? error?.message ?? 'An error occurred.'}</p>
          {response?.cause && <p className="text-xs max-w-md text-center">{response.cause}</p>}
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-3.5" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <p className="text-sm">No results to display.</p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-3.5" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-6 -my-8 flex flex-1 flex-col self-stretch overflow-hidden">
      <ResultsToolbar
        title="Results"
        plotCount={sortedData.length}
        currentPage={safePage}
        totalPages={totalPages}
        mapVisible={mapVisible}
        onToggleMap={setMapVisible}
        onBack={() => router.push("/")}
        onOpenWhispMap={handleOpenWhispMap}
        whispMapDisabled={tableData.length === 0 || !config?.api.url}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ flex: mapVisible ? "0 0 56%" : "1 1 0%" }}>
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <ResultsSearchBar
              searchValue={search}
              onSearchChange={handleSearchChange}
              fieldPickerOpen={fieldPickerOpen}
              onOpenFieldPicker={() => setFieldPickerOpen(true)}
              onExportCSV={() => handleExport("csv")}
              onExportGeoJSON={() => handleExport("geojson")}
              onExportExcel={() => handleExport("xlsx")}
            />
            <ResultsTable
              columns={columns}
              data={pageData}
              selectedRowId={selectedRow ? String(selectedRow.plotId) : null}
              onSelectRow={setSelectedRow}
              sortColumn={sortColumn}
              sortAsc={sortAsc}
              onSort={handleSort}
            />
            <ResultsPagination
              currentPage={safePage}
              totalPages={totalPages}
              totalRows={sortedData.length}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
            <FieldPicker
              open={fieldPickerOpen}
              columns={allColumns}
              groups={columnGroups}
              visible={visibleCols}
              defaultVisible={defaultVisibleCols}
              onChange={setVisibleCols}
              onClose={() => setFieldPickerOpen(false)}
            />
          </div>
        </div>
        <MapPane
          visible={mapVisible}
          geoJsonData={geoJsonData}
          selectedFeatureIndex={selectedFeatureIndex}
          onFeatureClick={handleFeatureClick}
        />
      </div>
    </div>
  );
}
