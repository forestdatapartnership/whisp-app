import { NextRequest } from "next/server";
import path from "path";
import fs from 'fs/promises';
import { getPool } from "@/lib/db";
import { analyzeGeoJson } from "@/lib/utils/runPython";
import { LogFunction } from "@/lib/logger";
import { useResponse } from "@/lib/hooks/responses";
import { SystemCode, getSystemCodeInfo } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";
import { AnalysisJob } from "@/types/analysisJob";
import { getMaxGeometryLimit, getMaxGeometryLimitSync, getPythonTimeoutMs, getPythonTimeoutSyncMs } from "@/lib/utils/configUtils";
import { atomicWriteFile } from "@/lib/utils/fileUtils";
import { getCommonPropertyNames, validateExternalIdColumn } from "./geojsonUtils";
import { jobCache } from "./jobCache";
import { sseEmitter } from "./sseEmitter";
import { createAnalysisJob, updateAnalysisJob } from "./analysisJobStore";

const LOG_SOURCE = "analyzePlots.ts";

const buildErrorInfo = (error: unknown) => {
    const baseMessage = getSystemCodeInfo(SystemCode.ANALYSIS_ERROR).message;
    if (error instanceof SystemError) {
        const { message, systemCode, formatArgs, cause } = error;
        return {
            error: message,
            code: systemCode,
            ...(formatArgs && formatArgs.length ? { formatArgs } : {}),
            ...(cause ? { cause: String(cause) } : {})
        };
    }
    if (error instanceof Error) {
        return { error: baseMessage, code: SystemCode.ANALYSIS_ERROR, cause: error.message };
    }
    const detail = String(error);
    return { error: baseMessage, code: SystemCode.ANALYSIS_ERROR, cause: detail };
};

const handleAnalysisError = async (token: string, error: any, log: LogFunction, filePath: string, shouldLog: boolean = true
) => {
    const errorInfo = buildErrorInfo(error);
    const errorMessage = errorInfo.cause ?? errorInfo.error;
    await updateAnalysisJob(token, {
        status: errorInfo.code,
        completedAt: new Date(),
        errorMessage: errorMessage
    });
    await atomicWriteFile(`${filePath}/${token}-error.json`, JSON.stringify(errorInfo), log);
    sseEmitter.emit(token, { ...errorInfo, final: true });
    if (shouldLog) {
        log("error", `Analysis failed: ${errorMessage}`, LOG_SOURCE);
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
        log("error", `Failed to read result: ${message}`, LOG_SOURCE);
        throw e;
    } finally {
        await fh?.close();
    }
};

export const analyzePlots = async (context: AnalysisJob, featureCollection: any, log: LogFunction, req?: NextRequest) => {
    const isAsync = featureCollection.analysisOptions?.async === true;
    const token = context.token;
    const filePath = path.join(process.cwd(), 'temp');
    const startTime = Date.now();
    const timeout = isAsync ? getPythonTimeoutMs() : getPythonTimeoutSyncMs();

    const geometryCount = context.featureCount ?? featureCollection.features.length;
    
    jobCache.set(token, { 
        featureCount: geometryCount,
        startTime: startTime
    });
    
    if (context.apiKey?.keyId) {
        if (context.apiKey?.maxConcurrentAnalyses && context.apiKey?.userId) {
            const pool = getPool();
            const { rows } = await pool.query(
                `SELECT COUNT(*)::int AS running
                 FROM analysis_jobs
                 WHERE user_id = $1
                   AND status = $2`,
                [context.apiKey.userId, SystemCode.ANALYSIS_PROCESSING]
            );
            const running = rows[0]?.running ?? 0;
            if (running >= context.apiKey.maxConcurrentAnalyses) {
                throw new SystemError(SystemCode.ANALYSIS_TOO_MANY_CONCURRENT);
            }
        }
    }
    await createAnalysisJob({
        ...context,
        featureCount: geometryCount,
        analysisOptions: context.analysisOptions ?? featureCollection.analysisOptions ?? undefined,
        status: SystemCode.ANALYSIS_PROCESSING,
    });
    
    const maxGeometryLimit = isAsync ? getMaxGeometryLimit() : getMaxGeometryLimitSync();

    if (geometryCount > maxGeometryLimit) {
        throw new SystemError(SystemCode.VALIDATION_TOO_MANY_GEOMETRIES, [maxGeometryLimit]);
    }

    if (featureCollection.analysisOptions?.externalIdColumn && !validateExternalIdColumn(featureCollection, featureCollection.analysisOptions?.externalIdColumn)) {
        throw new SystemError(SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN, [featureCollection.analysisOptions?.externalIdColumn, getCommonPropertyNames(featureCollection).join(', ')]);
    }

    log("info", `Starting analysis - async mode: ${isAsync}, geometry count: ${geometryCount}`, LOG_SOURCE);

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
