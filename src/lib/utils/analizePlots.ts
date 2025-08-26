import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { analyzeGeoJson } from "@/lib/utils/runPython";
import { LogFunction } from "@/lib/logger";
import { GEOMETRY_LIMIT } from "@/lib/utils/constants";
import { useBadRequestResponse } from "@/lib/hooks/responses";

export const analyzePlots = async (featureCollection: any, log: LogFunction, req?: NextRequest) => {
    const isAsync = featureCollection.analysisOptions?.async === true;
    const token = uuidv4();
    const filePath = path.join(process.cwd(), 'temp');
    const logSource = "analyzePlots.ts";

    const geometryCount = featureCollection.features.length;


    if (geometryCount > GEOMETRY_LIMIT) {
        return useBadRequestResponse(`There are more than ${GEOMETRY_LIMIT} features in this collection. Please do not exceed more than ${GEOMETRY_LIMIT} individual features.`);
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
                log("error", `Async analysis failed for token ${token}: ${error.message}`, logSource);
               
                try {
                    await fs.writeFile(
                        `${filePath}/${token}-error.json`,
                        JSON.stringify({ error: error.message }),
                        'utf8'
                    );
                } catch (writeError: any) {
                    log("error", `Failed to write error file for token ${token}: ${writeError.message}`, logSource);
                }
            });
            
            return NextResponse.json({
                token,
                status: 'processing',
                statusUrl: `/api/status/${token}`,
                resultUrl: `/api/report/${token}`
            });
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
            return NextResponse.json(
                { data: jsonData, token: token }
            )
        } else {
            throw new Error("Analysis failed.");
        }
    } catch (error) {
        throw error;
    } finally {
        // Explicitly close the file handle if it was opened
        if (fileHandle) {
            fileHandle.close();
        }
    }
}
