import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { analyzeGeoJson } from "@/lib/utils/runPython";
import { LogFunction } from "@/lib/logger";
import { useResponse } from "@/lib/hooks/responses";
import { SystemCode } from "@/types/systemCodes";
import { SystemError } from "@/types/systemError";

const GEOMETRY_LIMIT = parseInt(process.env.GEOMETRY_LIMIT || '500', 10);

export const analyzePlots = async (featureCollection: any, log: LogFunction, req?: NextRequest) => {
    const isAsync = featureCollection.analysisOptions?.async === true;
    const token = uuidv4();
    const filePath = path.join(process.cwd(), 'temp');
    const logSource = "analyzePlots.ts";

    const geometryCount = featureCollection.features.length;

    if (geometryCount > GEOMETRY_LIMIT) {
        return useResponse(
            SystemCode.VALIDATION_TOO_MANY_GEOMETRIES,
            [GEOMETRY_LIMIT]
        );
    }

    log("info", `Starting analysis: ${token}. Received GeoJSON with ${geometryCount} features`, logSource);

    // Check for legacy format header
    const useLegacyFormat = req?.headers.get('x-legacy-format') === 'true';

    let fileHandle;
    try {
        // Write the payload to a file
        await fs.writeFile(`${filePath}/${token}.json`, JSON.stringify(featureCollection), 'utf8');

        if (isAsync) {
            // Start background processing (don't await)
            analyzeGeoJson(token, log, undefined, useLegacyFormat).catch(async (error) => {
                log("error", `Async analysis failed for token ${token}: ${error}`, logSource);
               
                try {
                    // Handle structured error objects with specific codes
                    let errorInfo;
                    if (typeof error === 'object' && error.code) {
                        const errorObj = error as any;
                        errorInfo = { 
                            error: errorObj.message,
                            code: errorObj.code,
                            ...(errorObj.formatArgs && { formatArgs: errorObj.formatArgs })
                        };
                    } else {
                        errorInfo = { 
                            error: error.toString(),
                            code: SystemCode.ANALYSIS_ERROR
                        };
                    }
                    
                    await fs.writeFile(
                        `${filePath}/${token}-error.json`,
                        JSON.stringify(errorInfo),
                        'utf8'
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
        const analyzed = await analyzeGeoJson(token, log, undefined, useLegacyFormat);

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
