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
import { getCommonPropertyNames, validateExternalIdColumn } from "./geojsonUtils";
import { jobCache } from "./jobCache";

export const analyzePlots = async (featureCollection: any, log: LogFunction, req?: NextRequest) => {
    const isAsync = featureCollection.analysisOptions?.async === true;
    const token = uuidv4();
    const filePath = path.join(process.cwd(), 'temp');
    const logSource = "analyzePlots.ts";
    const startTime = Date.now();

    const geometryCount = featureCollection.features.length;
    
    jobCache.set(token, { 
        featureCount: geometryCount,
        startTime: startTime
    });
    
    const maxGeometryLimit = isAsync ? getMaxGeometryLimit() : getMaxGeometryLimitSync();

    if (geometryCount > maxGeometryLimit) {
        throw new SystemError(SystemCode.VALIDATION_TOO_MANY_GEOMETRIES, [maxGeometryLimit]);
    }

    if (featureCollection.analysisOptions?.externalIdColumn && !validateExternalIdColumn(featureCollection, featureCollection.analysisOptions?.externalIdColumn)) {
        throw new SystemError(SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN, [featureCollection.analysisOptions?.externalIdColumn, getCommonPropertyNames(featureCollection).join(', ')]);
    }

    const timeout = isAsync? getPythonTimeoutMs() : getPythonTimeoutSyncMs();

    log("info", `Starting analysis for ${token}, async mode: ${isAsync}, geometry count: ${geometryCount}`, logSource);

    // Check for legacy format header
    const useLegacyFormat = req?.headers.get('x-legacy-format') === 'true';

    let fileHandle;
    try {
        await atomicWriteFile(`${filePath}/${token}.json`, JSON.stringify(featureCollection), log);       

        if (isAsync) {
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
                    ...(geometryCount !== undefined && { featureCount: geometryCount })
                }
            );
        }

        const analyzed = await analyzeGeoJson(token, log, timeout, useLegacyFormat);

        if (analyzed) {
            fileHandle = await fs.open(`${filePath}/${token}-result.json`, 'r');
            const fileContents = await fileHandle.readFile('utf8');
            const jsonData = JSON.parse(fileContents);
            
            return  useResponse(SystemCode.ANALYSIS_COMPLETED, jsonData, { token });
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
