import { downloadBlob, timestampFilename } from "@/lib/utils/export";
import { downloadOfflineReport } from "./offline-report";

type DownloadFailure = "expired" | "timeout" | "failed";

export class ReportDownloadError extends Error {
  constructor(public readonly reason: DownloadFailure) {
    super(`Report download ${reason}`);
  }
}

export async function exportHtmlReport(input: Parameters<typeof downloadOfflineReport>[0] & {
  local: boolean;
  token: string;
  apiUrl?: string;
  timeoutMs?: number;
}) {
  if (input.local) {
    downloadOfflineReport(input);
    return;
  }
  if (!input.apiUrl) throw new ReportDownloadError("failed");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 60_000);
  try {
    const query = new URLSearchParams({ language: input.language ?? "en", theme: input.theme });
    const url = `${input.apiUrl.replace(/\/+$/, "")}/results/${encodeURIComponent(input.token)}.html?${query}`;
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (response.status === 404) throw new ReportDownloadError("expired");
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      throw new ReportDownloadError("failed");
    }
    const blob = await response.blob();
    const filename = response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1];
    downloadBlob(blob, filename ?? timestampFilename("html", "report"));
  } catch (error) {
    if (controller.signal.aborted) throw new ReportDownloadError("timeout");
    if (error instanceof ReportDownloadError) throw error;
    throw new ReportDownloadError("failed");
  } finally {
    clearTimeout(timer);
  }
}
