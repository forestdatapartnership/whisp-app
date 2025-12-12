export const formatDuration = (ms: number | null | undefined) => {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
};

export const deriveDurationMs = (startedAt?: string | null, completedAt?: string | null) => {
  if (!startedAt) return null;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = completedAt ? new Date(completedAt) : new Date();
  if (Number.isNaN(end.getTime())) return null;
  const diff = end.getTime() - start.getTime();
  return diff >= 0 ? diff : null;
};

export const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

export const formatRelative = (value: string | null | undefined) => {
  if (!value) return { label: "—", tooltip: "—" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: "—", tooltip: "—" };
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  let label = "";
  if (diffSec < 60) label = `${diffSec}s ago`;
  else if (diffMin < 60) label = `${diffMin}m ago`;
  else if (diffHr < 24) label = `${diffHr}h ago`;
  else label = `${diffDay}d ago`;
  return { label, tooltip: date.toLocaleString() };
};

export const truncateString = (str: string, limit = 20) => {
  if (typeof str !== "string") return "";
  return str.length > limit ? `${str.slice(0, limit)}…` : str;
};

export const formatAnalysisCellValue = (column: string, value: any) => {
  if (value === null || value === undefined) return "na";

  if (typeof value === "object") {
    try {
      if (
        column === "geojson" ||
        column === "geometry" ||
        (value.type && (value.coordinates || value.geometries))
      ) {
        return `[${value.type} Geometry]`;
      }
      if (value instanceof Date) {
        return formatDateTime(value);
      }
      if (Array.isArray(value)) {
        if (!value.length) return "[]";
        if (value.length > 3) return `[${value.slice(0, 3).join(", ")}... +${value.length - 3} more]`;
        return `[${value.join(", ")}]`;
      }
      return JSON.stringify(value);
    } catch {
      return "[Complex Object]";
    }
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    const col = column.toLowerCase();
    const isCoordinate = col.includes("lat") || col.includes("lon") || col.includes("centroid");
    if (isCoordinate) return value;
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  }

  if (column === "geoid" || column === "WDPA") {
    return typeof value === "string" && value.trim().length > 0 ? truncateString(value) : "na";
  }

  return value;
};

