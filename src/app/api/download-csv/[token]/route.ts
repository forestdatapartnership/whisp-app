import { NextRequest, NextResponse } from "next/server";
import path from "path";
import type { FeatureCollection } from "geojson";
import { compose } from "@/lib/middleware/compose";
import { withLogging } from "@/lib/middleware/withLogging";
import { withErrorHandling } from "@/lib/middleware/withErrorHandling";
import { LogFunction } from "@/lib/logger";
import { atomicWriteFile, fileExists, readFile } from "@/lib/utils/fileUtils";
import { geoJsonFeatureCollectionToCsvString, timestampFilename } from "@/lib/utils/downloadCsv";
import { SystemError } from "@/types/systemError";
import { SystemCode } from "@/types/systemCodes";

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (
  _req: NextRequest,
  log: LogFunction,
  context: { params: Promise<{ token: string }> }
): Promise<NextResponse> => {
  const { token } = await context.params;
  if (!token || token.includes("..") || token.includes("/") || token.includes("\\")) {
    throw new SystemError(SystemCode.ANALYSIS_JOB_NOT_FOUND);
  }

  const tempDir = path.join(process.cwd(), "temp");
  const resultCsvPath = path.join(tempDir, `${token}-result.csv`);
  const resultJsonPath = path.join(tempDir, `${token}-result.json`);

  const filename = timestampFilename("csv");
  const responseHeaders = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}; filename="${filename}"`,
    "Cache-Control": "no-cache",
  } as const;

  if (await fileExists(resultCsvPath, log)) {
    const cached = await readFile(resultCsvPath, log);
    if (cached.length > 0) {
      return new NextResponse(cached, { headers: responseHeaders });
    }
  }

  if (!(await fileExists(resultJsonPath, log))) {
    throw new SystemError(SystemCode.ANALYSIS_JOB_NOT_FOUND);
  }

  const raw = await readFile(resultJsonPath, log);
  if (!raw?.length) {
    throw new SystemError(SystemCode.ANALYSIS_JOB_NOT_FOUND);
  }

  let geojson: FeatureCollection;
  try {
    geojson = JSON.parse(raw) as FeatureCollection;
  } catch {
    throw new SystemError(SystemCode.VALIDATION_INVALID_GEOJSON, ["Invalid analysis result JSON"]);
  }

  if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    throw new SystemError(SystemCode.VALIDATION_INVALID_GEOJSON, ["Result is not a FeatureCollection"]);
  }

  const csv = geoJsonFeatureCollectionToCsvString(geojson);
  if (csv === null) {
    throw new SystemError(SystemCode.VALIDATION_INVALID_GEOJSON, ["No exportable features"]);
  }

  await atomicWriteFile(resultCsvPath, csv, log);

  return new NextResponse(csv, { headers: responseHeaders });
});
