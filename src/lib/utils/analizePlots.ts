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

const LOG_SOURCE = "analyzePlots.ts";

const buildErrorInfo = (error: unknown) => {
    if (error instanceof SystemError) {
        const { message, systemCode, formatArgs } = error;
        return {
            error: message,
            code: systemCode,
            ...(formatArgs ? { formatArgs } : {})
        };
    }
    if (error instanceof Error) {
        return { error: error.message, code: SystemCode.ANALYSIS_ERROR };
    }
    return { error: String(error), code: SystemCode.ANALYSIS_ERROR };
};

const handleAnalysisError = async (token: string, error: any, log: LogFunction, filePath: string, shouldLog: boolean = true
) => {
    const errorInfo = buildErrorInfo(error);
    await updateAnalysisJob(token, {
        status: errorInfo.code,
        completedAt: new Date(),
        errorMessage: errorInfo.error
    });
    await atomicWriteFile(`${filePath}/${token}-error.json`, JSON.stringify(errorInfo), log);
    sseEmitter.emit(token, { ...errorInfo, final: true });
    if (shouldLog) {
        log("error", `Analysis failed for ${token}: ${errorInfo.error}`, LOG_SOURCE);
    }
    return errorInfo;
};

const handleAnalysisSuccess = async (token: string, filePath: string, log: LogFunction) => {
    let fh: fs.FileHandle | undefined;
    try {
        fh = await fs.open(`${filePath}/${token}-result.json`, 'r');
        const data = JSON.parse(await fh.readFile('utf8'));
        sseEmitter.emit(token, { code: SystemCode.ANALYSIS_COMPLETED, data, final: true });
        return data;
    } catch (e: any) {
        const message = e instanceof Error ? e.message : String(e);
        log("error", `Failed to read result for ${token}: ${message}`, LOG_SOURCE);
        throw e;
    } finally {
        await fh?.close();
    }
};

export const analyzePlots = async (featureCollection: any, log: LogFunction, req?: NextRequest, apiKey?: ApiKeyContext) => {
    const isAsync = featureCollection.analysisOptions?.async === true;
    const token = uuidv4();
    const filePath = path.join(process.cwd(), 'temp');
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

    log("info", `Starting analysis for ${token}, async mode: ${isAsync}, geometry count: ${geometryCount}`, LOG_SOURCE);

    // Check for legacy format header
    const useLegacyFormat = req?.headers.get('x-legacy-format') === 'true';

    try {
        await atomicWriteFile(`${filePath}/${token}.json`, JSON.stringify(featureCollection), log);       

        const analysisPromise = analyzeGeoJson(token, log, timeout, useLegacyFormat);

        if (isAsync) {
            analysisPromise
                .then(() => handleAnalysisSuccess(token, filePath, log))
                .catch((error) => handleAnalysisError(token, error, log, filePath));

            return useResponse(
                SystemCode.ANALYSIS_PROCESSING,
                {
                    token,
                    statusUrl: `/api/status/${token}`,
                    ...(geometryCount !== undefined && { featureCount: geometryCount })
                }
            );
        }

        await analysisPromise;
        const jsonData = await handleAnalysisSuccess(token, filePath, log);
        return useResponse(SystemCode.ANALYSIS_COMPLETED, jsonData, { token });
    } catch (error: any) {
        await handleAnalysisError(token, error, log, filePath, false);
        throw error;
    }
}
