"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnalysisProgress } from "@/components/results/analysis-progress";
import { AnalysisError } from "@/components/results/analysis-error";
import { ResultsToolbar } from "@/components/results/results-toolbar";
import { ResultsSearchBar } from "@/components/results/results-search-bar";
import { ResultsTable, type ColumnDef, type ResultRow } from "@/components/results/results-table";
import { ResultsSummary } from "@/components/results/results-summary";
import { ResultsPagination } from "@/components/results/results-pagination";
import { MapPane } from "@/components/results/map-pane";
import { FieldPicker, type ColumnGroup } from "@/components/results/field-picker";
import { useConfig } from "@/lib/config/config-context";
import { useJobStatus } from "@/lib/submission/useJobStatus";
import { readSyncResult } from "@/lib/submission/sync-result";
import { downloadCsv, downloadGeoJson, timestampFilename } from "@/lib/utils/export";
import { downloadOfflineReport } from "@/lib/results/offline-report";
import {
  clearLocalResults,
  readLocalResults,
} from "@/lib/results/local-results";
import { versionsMatch } from "@/lib/results/parse-results-file";
import { useTheme } from "@/components/layout/theme-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/icons";
import { getResultFields } from "@/app/docs/reference/result-fields/actions";
import { isTruthyCell, type RiskFilter } from "@/lib/results/catalog-fields";
import {
  formatResultsFilterLabel,
  getCommodity,
  getCommodityByRiskField,
  WATERBODY_FIELD,
  type CommodityKey,
} from "@/lib/results/risk-trees";
import type { ResultField } from "@/types/models";
import type { FeatureCollection } from "geojson";

function buildFromFields(fields: ResultField[]) {
  const eligible = fields.filter((f) => f.analysisMetadata?.excludeFromOutput !== true);
  const sorted = [...eligible].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

  const allColumns: ColumnDef[] = sorted.map((f) => ({
    key: f.id,
    header: f.displayMetadata?.displayName ?? f.id,
    type: f.type,
    category: f.category,
    description: f.description,
    commodityMetadata: f.commodityMetadata,
    excludeFromResults: f.displayMetadata?.excludeFromResults === true,
  }));

  const categoryMap = new Map<string, string[]>();
  for (const f of sorted) {
    const cat = f.category ?? "Other";
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(f.id);
  }
  const columnGroups: ColumnGroup[] = [...categoryMap.entries()].map(([name, columns]) => ({
    name,
    columns,
  }));

  const defaultVisible = sorted
    .filter(
      (f) =>
        f.displayMetadata?.excludeFromResults !== true &&
        f.displayMetadata?.visibleByDefault !== false &&
        !(f.id.startsWith("Ind_") && f.displayMetadata?.visibleByDefault !== true)
    )
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
  const { theme } = useTheme();
  const isLocal = id === "local";

  const [mapVisible, setMapVisible] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter | null>(null);
  const [indicatorFilter, setIndicatorFilter] = useState<string | null>(null);
  const [commodity, setCommodity] = useState<CommodityKey>("pcrop");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRow, setSelectedRow] = useState<ResultRow | null>(null);
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [allColumns, setAllColumns] = useState<ColumnDef[]>([]);
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>([]);
  const [visibleCols, setVisibleCols] = useState<string[]>([]);
  const [defaultVisibleCols, setDefaultVisibleCols] = useState<string[]>([]);
  const [tableData, setTableData] = useState<ResultRow[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const [localMissing, setLocalMissing] = useState(false);

  const riskField = getCommodity(commodity).riskField;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (summaryOpen) {
        setSummaryOpen(false);
        return;
      }
      if (fieldPickerOpen) {
        setFieldPickerOpen(false);
        return;
      }
      if (selectedRow) setSelectedRow(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [summaryOpen, fieldPickerOpen, selectedRow]);

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
      const hasGeometry = fc.features.some((f) => f.geometry != null);
      if (!hasGeometry) setMapVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!isLocal) return;
    const current = config?.app.openforisWhispVersion?.trim() || "";
    if (!current) return;

    const stored = readLocalResults();
    if (!stored || !versionsMatch(stored.whispVersion, current)) {
      clearLocalResults();
      setLocalMissing(true);
      return;
    }
    handleCompleted(stored.featureCollection);
  }, [isLocal, handleCompleted, config?.app.openforisWhispVersion]);

  useEffect(() => {
    if (isLocal) return;
    const sync = readSyncResult(id);
    if (sync) handleCompleted(sync);
  }, [id, isLocal, handleCompleted]);

  const { response, isLoading, error } = useJobStatus({
    token: isLocal ? null : id,
    onCompleted: handleCompleted,
  });

  const code = response?.code;
  const isProcessing = !isLocal && (code === "analysis_processing" || code === "analysis_queued");
  const isError =
    !isLocal &&
    (!!error ||
      (!!code &&
        code !== "analysis_completed" &&
        code !== "analysis_processing" &&
        code !== "analysis_queued"));

  const searchedData = useMemo(() => {
    if (!search.trim()) return tableData;
    const q = search.toLowerCase();
    const keys = ["plotId", "external_id", "Country", "Admin_Level_1"] as const;
    return tableData.filter((row) =>
      keys.some((key) => String(row[key] ?? "").toLowerCase().includes(q))
    );
  }, [tableData, search]);

  const filteredData = useMemo(() => {
    let rows = searchedData;
    if (riskFilter) {
      rows = rows.filter((row) => row[riskFilter.field] === riskFilter.value);
    }
    if (indicatorFilter) {
      rows = rows.filter((row) => isTruthyCell(row[indicatorFilter]));
    }
    return rows;
  }, [searchedData, riskFilter, indicatorFilter]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const columnType = allColumns.find((c) => c.key === sortColumn)?.type;
    return [...filteredData].sort((a, b) => {
      const cmp = compareResultValues(a[sortColumn], b[sortColumn], sortColumn, columnType);
      return sortAsc ? cmp : -cmp;
    });
  }, [filteredData, sortColumn, sortAsc, allColumns]);

  const filteredGeoJson = useMemo(() => {
    if (!geoJsonData) return null;
    const ids = new Set(filteredData.map((r) => String(r.plotId)));
    return {
      type: "FeatureCollection" as const,
      features: geoJsonData.features.filter((f) =>
        ids.has(String(f.properties?.plotId ?? ""))
      ),
    };
  }, [geoJsonData, filteredData]);

  useEffect(() => {
    if (!selectedRow) return;
    if (!filteredData.some((r) => r.plotId === selectedRow.plotId)) {
      setSelectedRow(null);
    }
  }, [filteredData, selectedRow]);

  const filterLabel = useMemo(
    () => formatResultsFilterLabel(riskFilter, indicatorFilter),
    [riskFilter, indicatorFilter]
  );

  const handleCommodityChange = useCallback(
    (key: CommodityKey) => {
      setCommodity(key);
      const next = getCommodity(key);
      let cleared = false;
      if (riskFilter && riskFilter.field !== next.riskField) {
        setRiskFilter(null);
        cleared = true;
      }
      if (
        indicatorFilter &&
        indicatorFilter !== WATERBODY_FIELD &&
        !next.indicators.some((i) => i.key === indicatorFilter)
      ) {
        setIndicatorFilter(null);
        cleared = true;
      }
      if (cleared) setCurrentPage(1);
    },
    [riskFilter, indicatorFilter]
  );

  const handleRiskFilter = useCallback((filter: RiskFilter | null) => {
    setRiskFilter(filter);
    setIndicatorFilter(null);
    setCurrentPage(1);
    const match = filter ? getCommodityByRiskField(filter.field) : null;
    if (match) setCommodity(match.key);
  }, []);

  const handleIndicatorFilter = useCallback((field: string | null) => {
    setIndicatorFilter(field);
    setRiskFilter(null);
    setCurrentPage(1);
  }, []);

  const handleClearFilter = useCallback(() => {
    setRiskFilter(null);
    setIndicatorFilter(null);
    setCurrentPage(1);
  }, []);

  const handleOpenSummary = useCallback(() => {
    setFieldPickerOpen(false);
    setSummaryOpen(true);
  }, []);

  const handleOpenFieldPicker = useCallback(() => {
    setSummaryOpen(false);
    setFieldPickerOpen(true);
  }, []);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageData = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, safePage, rowsPerPage]);

  const handleSort = useCallback(
    (key: string) => {
      setCurrentPage(1);
      if (sortColumn === key) setSortAsc((asc) => !asc);
      else {
        setSortColumn(key);
        setSortAsc(true);
      }
    },
    [sortColumn]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const leaveToHome = useCallback(() => {
    if (isLocal) clearLocalResults();
    router.push("/");
  }, [isLocal, router]);

  const handleOpenWhispMap = useCallback(() => {
    if (isLocal || tableData.length === 0 || !config?.api.url) return;
    const downloadUrl = `${config.api.url}/generate-geojson/${id}`;
    window.open(
      `https://whisp.earthmap.org/?aoi=WHISP&fetchJson=${encodeURIComponent(downloadUrl)}`,
      "_blank"
    );
  }, [id, isLocal, tableData.length, config?.api.url]);

  const handleExportCsv = useCallback(() => {
    const cols = allColumns.map((c) => c.key);
    downloadCsv(
      cols,
      tableData.map((row) => Object.fromEntries(cols.map((c) => [c, row[c]]))),
      timestampFilename("csv")
    );
  }, [allColumns, tableData]);

  const handleExportGeoJson = useCallback(() => {
    if (!geoJsonData) return;
    downloadGeoJson(geoJsonData, timestampFilename("geojson"));
  }, [geoJsonData]);

  const handleExportHtml = useCallback(() => {
    downloadOfflineReport({
      rows: tableData,
      columns: allColumns,
      title: isLocal ? "WHISP risk report · GeoJSON" : `WHISP risk report · ${id}`,
      theme,
    });
  }, [tableData, allColumns, id, isLocal, theme]);

  const selectedFeatureIndex = useMemo(() => {
    if (!selectedRow || !filteredGeoJson) return undefined;
    const i = filteredGeoJson.features.findIndex(
      (f) => f.properties?.plotId === selectedRow.plotId
    );
    return i >= 0 ? i : undefined;
  }, [selectedRow, filteredGeoJson]);

  const handleFeatureClick = useCallback(
    (featureIndex: number) => {
      if (!filteredGeoJson) return;
      const plotId = String(
        filteredGeoJson.features[featureIndex]?.properties?.plotId ?? ""
      );
      if (!plotId) return;
      const rowIndex = sortedData.findIndex((r) => String(r.plotId) === plotId);
      if (rowIndex === -1) return;
      setSelectedRow(sortedData[rowIndex]);
      setCurrentPage(Math.floor(rowIndex / rowsPerPage) + 1);
    },
    [filteredGeoJson, sortedData, rowsPerPage]
  );

  if (!isLocal && isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-10 text-accent-green" />
      </div>
    );
  }

  if (isProcessing) {
    const featureCount = response?.data?.featureCount as number | undefined;
    const percent = response?.data?.percent as number | undefined;
    const messages = response?.data?.processStatusMessages as string[] | undefined;
    const asyncMode = response?.data?.asyncMode as boolean | undefined;
    return (
      <AnalysisProgress
        token={id}
        code={code}
        featureCount={featureCount}
        percent={percent}
        messages={messages}
        asyncMode={asyncMode}
        onCancelled={() => router.push("/")}
      />
    );
  }

  if (isError) {
    return (
      <AnalysisError
        message={response?.message ?? error?.message ?? "An error occurred."}
        cause={response?.cause}
        onBack={() => router.back()}
      />
    );
  }

  if (isLocal && localMissing) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <p className="text-sm">No GeoJSON results loaded. Open a matching export from the home page.</p>
          <Button variant="outline" size="sm" onClick={leaveToHome}>
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
          <Button variant="outline" size="sm" onClick={leaveToHome}>
            <ArrowLeft className="size-3.5" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const pickerColumns = allColumns.filter((c) => !c.excludeFromResults);
  const pickerGroups = columnGroups.map((g) => ({
    ...g,
    columns: g.columns.filter(
      (c) => !allColumns.find((col) => col.key === c)?.excludeFromResults
    ),
  }));

  return (
    <div className="-mx-6 -my-8 flex flex-1 flex-col self-stretch overflow-hidden">
      <ResultsToolbar
        title={isLocal ? "GeoJSON Results" : "Results"}
        plotCount={sortedData.length}
        mapVisible={mapVisible}
        onToggleMap={setMapVisible}
        summaryOpen={summaryOpen}
        onOpenSummary={handleOpenSummary}
        onCloseSummary={() => setSummaryOpen(false)}
        onBack={leaveToHome}
        onExportCsv={handleExportCsv}
        onExportGeoJson={handleExportGeoJson}
        onExportHtml={handleExportHtml}
        onOpenWhispMap={handleOpenWhispMap}
        whispMapDisabled={isLocal || !config?.api.url}
      />
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row lg:overflow-hidden">
        <div
          className={`flex min-w-0 flex-col overflow-hidden ${mapVisible ? "flex-1 lg:flex-[0_0_56%]" : "flex-1"}`}
        >
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <ResultsSearchBar
              searchValue={search}
              onSearchChange={handleSearchChange}
              fieldPickerOpen={fieldPickerOpen}
              onOpenFieldPicker={handleOpenFieldPicker}
              filterLabel={filterLabel}
              onClearFilter={handleClearFilter}
            />
            <ResultsTable
              columns={allColumns}
              visibleCols={visibleCols}
              data={pageData}
              presenceRows={tableData}
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
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(rows) => {
                setRowsPerPage(rows);
                setCurrentPage(1);
              }}
            />
            <FieldPicker
              open={fieldPickerOpen}
              columns={pickerColumns}
              groups={pickerGroups}
              visible={visibleCols}
              defaultVisible={defaultVisibleCols}
              onChange={setVisibleCols}
              onClose={() => setFieldPickerOpen(false)}
            />
            <ResultsSummary
              open={summaryOpen}
              rows={searchedData}
              filteredCount={filteredData.length}
              columns={allColumns}
              commodity={commodity}
              onCommodityChange={handleCommodityChange}
              selectedRow={selectedRow}
              onClearSelection={() => setSelectedRow(null)}
              riskFilter={riskFilter}
              onRiskFilter={handleRiskFilter}
              indicatorFilter={indicatorFilter}
              onIndicatorFilter={handleIndicatorFilter}
              onClearFilter={handleClearFilter}
              onCountryFilter={(country) => {
                setSearch(country);
                setCurrentPage(1);
                setSummaryOpen(false);
              }}
            />
          </div>
        </div>
        <MapPane
          visible={mapVisible}
          geoJsonData={filteredGeoJson}
          selectedFeatureIndex={selectedFeatureIndex}
          riskField={riskField}
          onFeatureClick={handleFeatureClick}
        />
      </div>
    </div>
  );
}
