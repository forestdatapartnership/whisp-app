import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { analyzeGeoJson } from "@/lib/utils/runPython";
import { LogFunction } from "@/lib/logger";
import { useResponse } from "@/lib/hooks/responses";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";
import { getMaxGeometryLimit, getMaxGeometryLimitSync, getPythonTimeoutMs, getPythonTimeoutSyncMs } from "@/lib/utils/configUtils";
import { atomicWriteFile } from "@/lib/utils/fileUtils";

export const analyzePlots = async (featureCollection: any, log: LogFunction, req?: NextRequest) => {
    const isAsync = featureCollection.analysisOptions?.async === true;
    const token = uuidv4();
    const filePath = path.join(process.cwd(), 'temp');
    const logSource = "analyzePlots.ts";

    const geometryCount = featureCollection.features.length;
    const maxGeometryLimit = isAsync ? getMaxGeometryLimit() : getMaxGeometryLimitSync();

    if (geometryCount > maxGeometryLimit) {
        throw new SystemError(SystemCode.VALIDATION_TOO_MANY_GEOMETRIES, [maxGeometryLimit]);
    }

    const timeout = isAsync? getPythonTimeoutMs() : getPythonTimeoutSyncMs();

    log("info", `Starting analysis: ${token}. Received GeoJSON with ${geometryCount} features`, logSource);

    // Check for legacy format header
    const useLegacyFormat = req?.headers.get('x-legacy-format') === 'true';

    let fileHandle;
    try {
        await atomicWriteFile(`${filePath}/${token}.json`, JSON.stringify(featureCollection), log);

        if (isAsync) {
            // Start background processing (don't await)
            analyzeGeoJson(token, log, timeout, useLegacyFormat).catch(async (error) => {
                log("error", `Async analysis failed for token ${token}: ${error}`, logSource);
               
                try {
                    let errorInfo;
                    if (error instanceof SystemError) {
                        errorInfo = { 
                            error: error.message,
                            code: error.systemCode,
                            ...(error.formatArgs && { formatArgs: error.formatArgs })
                        };
                    } else {
                        errorInfo = { 
                            error: error.toString(),
                            code: SystemCode.ANALYSIS_ERROR
                        };
                    }
                    
                    await atomicWriteFile(
                        `${filePath}/${token}-error.json`,
                        JSON.stringify(errorInfo),
                        log
                    );
                } catch (writeError: any) {
                    log("error", `Failed to write error file for token ${token}: ${writeError.message}`, logSource);
                }
            });
            
            return useResponse(
                SystemCode.ANALYSIS_PROCESSING,
                {
                    token,
                    statusUrl: `/api/status/${token}`,
                }
            );
        }

        // Pass the legacy format flag to analyzeGeoJson
        const analyzed = await analyzeGeoJson(token, log, timeout, useLegacyFormat);

        if (analyzed) {
            // Read and parse the analysis results
            fileHandle = await fs.open(`${filePath}/${token}-result.json`, 'r'); // Explicitly open the file
            const fileContents = await fileHandle.readFile('utf8');
            const jsonData = JSON.parse(fileContents);
            if (Array.isArray(jsonData)) {
                log("info", `${jsonData.length} plots successfully analysed for token ${token}`, logSource, { token: token, plots: jsonData.length });
            }
            return  useResponse(SystemCode.ANALYSIS_COMPLETED, jsonData);
        } else {
            throw new SystemError(SystemCode.ANALYSIS_ERROR);
        }
    } finally {
        // Explicitly close the file handle if it was opened
        if (fileHandle) {
            fileHandle.close();
        }
    }
}
