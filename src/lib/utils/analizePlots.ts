import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from "@/lib/db";
import { analyzeGeoJson } from "@/lib/utils/runPython";
import { LogFunction } from "@/lib/logger";
import { useResponse } from "@/lib/hooks/responses";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";
import { getMaxGeometryLimit, getMaxGeometryLimitSync, getPythonTimeoutMs, getPythonTimeoutSyncMs } from "@/lib/utils/configUtils";
import { atomicWriteFile } from "@/lib/utils/fileUtils";
import { getCommonPropertyNames, validateExternalIdColumn } from "./geojsonUtils";
import { jobCache } from "./jobCache";
import { sseEmitter } from "./sseEmitter";
import { createAnalysisJob, updateAnalysisJob } from "./analysisJobStore";

type ApiKeyContext = {
    apiKeyId: number;
    userId?: number | null;
    maxConcurrentAnalyses?: number | null;
};

export const analyzePlots = async (featureCollection: any, log: LogFunction, req?: NextRequest, apiKey?: ApiKeyContext) => {
    const isAsync = featureCollection.analysisOptions?.async === true;
    const token = uuidv4();
    const filePath = path.join(process.cwd(), 'temp');
    const logSource = "analyzePlots.ts";
    const startTime = Date.now();
    const timeout = isAsync ? getPythonTimeoutMs() : getPythonTimeoutSyncMs();

    const geometryCount = featureCollection.features.length;
    
    jobCache.set(token, { 
        featureCount: geometryCount,
        startTime: startTime
    });
    
    if (apiKey) {
        if (apiKey.maxConcurrentAnalyses && apiKey.userId) {
            const pool = getPool();
            const { rows } = await pool.query(
                `SELECT COUNT(*)::int AS running
                 FROM analysis_jobs
                 WHERE user_id = $1
                   AND status = $2
                   AND (
                        started_at IS NULL
                        OR timeout_ms IS NULL
                        OR started_at + (timeout_ms || ' milliseconds')::interval > now()
                   )`,
                [apiKey.userId, SystemCode.ANALYSIS_PROCESSING]
            );
            const running = rows[0]?.running ?? 0;
            if (running >= apiKey.maxConcurrentAnalyses) {
                throw new SystemError(SystemCode.ANALYSIS_TOO_MANY_CONCURRENT);
            }
        }
        await createAnalysisJob({
            token,
            apiKeyId: apiKey.apiKeyId,
            userId: apiKey.userId ?? null,
            featureCount: geometryCount,
            analysisOptions: featureCollection.analysisOptions ?? null,
            status: SystemCode.ANALYSIS_PROCESSING,
            timeoutMs: timeout
        });
    }
    
    const maxGeometryLimit = isAsync ? getMaxGeometryLimit() : getMaxGeometryLimitSync();

    if (geometryCount > maxGeometryLimit) {
        throw new SystemError(SystemCode.VALIDATION_TOO_MANY_GEOMETRIES, [maxGeometryLimit]);
    }

    if (featureCollection.analysisOptions?.externalIdColumn && !validateExternalIdColumn(featureCollection, featureCollection.analysisOptions?.externalIdColumn)) {
        throw new SystemError(SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN, [featureCollection.analysisOptions?.externalIdColumn, getCommonPropertyNames(featureCollection).join(', ')]);
    }

    log("info", `Starting analysis for ${token}, async mode: ${isAsync}, geometry count: ${geometryCount}`, logSource);

    // Check for legacy format header
    const useLegacyFormat = req?.headers.get('x-legacy-format') === 'true';

    let fileHandle;
    try {
        await atomicWriteFile(`${filePath}/${token}.json`, JSON.stringify(featureCollection), log);       

        if (isAsync) {
            analyzeGeoJson(token, log, timeout, useLegacyFormat).then(async () => {
                let fh: fs.FileHandle | undefined;
                try {
                    fh = await fs.open(`${filePath}/${token}-result.json`, 'r');
                    const data = JSON.parse(await fh.readFile('utf8'));
                    sseEmitter.emit(token, { code: SystemCode.ANALYSIS_COMPLETED, data, final: true });
                } catch (e: any) {
                    log("error", `Failed to read result for ${token}: ${e.message}`, logSource);
                } finally {
                    fh?.close();
                }
            }).catch(async (error) => {
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
                    
                    await updateAnalysisJob(token, {
                        status: errorInfo.code,
                        completedAt: new Date(),
                        errorMessage: errorInfo.error
                    });
                    
                    await atomicWriteFile(
                        `${filePath}/${token}-error.json`,
                        JSON.stringify(errorInfo),
                        log
                    );
                    sseEmitter.emit(token, { ...errorInfo, final: true });
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
    } catch (error: any) {
        const status = error instanceof SystemError ? error.systemCode : SystemCode.ANALYSIS_ERROR;
        const errorMessage = error instanceof Error ? error.message : String(error);
        await updateAnalysisJob(token, {
            status,
            completedAt: new Date(),
            errorMessage
        });
        throw error;
    } finally {
        if (fileHandle) {
            fileHandle.close();
        }
    }
}
