import { NextResponse, NextRequest } from "next/server";
import path from "path";
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { analyzeGeoJson } from "@/lib/utils/runPython";
import { LogFunction } from "@/lib/logger";

export const analyzePlots = async (payload: any, log: LogFunction, req?: NextRequest) => {

    const token = uuidv4();
    const filePath = path.join(process.cwd(), 'temp');
    const logSource = "analyzePlots.ts";
    
    // Check for legacy format header
    const useLegacyFormat = req?.headers.get('x-legacy-format') === 'true';
    if (useLegacyFormat) {
        log("info", "Using legacy format output based on x-legacy-format header", logSource);
    }

    let fileHandle;
    try {
        // Write the payload to a file
        await fs.writeFile(`${filePath}/${token}.json`, JSON.stringify(payload));

        log("debug", `Starting analysis: ${token}`, logSource);

        // Pass the legacy format flag to analyzeGeoJson
        const analyzed = await analyzeGeoJson(token, log, undefined, useLegacyFormat);
 
        if (analyzed) {
            // Read and parse the analysis results
            fileHandle = await fs.open(`${filePath}/${token}-result.json`, 'r'); // Explicitly open the file
            const fileContents = await fileHandle.readFile('utf8'); 
            const jsonData = JSON.parse(fileContents);
            if (Array.isArray(jsonData)){
                log("info",`${jsonData.length} plots successfully analysed for token ${token}`, logSource, { token: token, plots: jsonData.length });
            }
            return NextResponse.json(
                { data: jsonData, token: token }
            )
        } else {
            throw new Error("Analysis failed.");
        }
    } catch (error) {
        // logged at higher withErrorHandling level
        throw error;
    } finally {
        // Explicitly close the file handle if it was opened
        if (fileHandle) {
            fileHandle.close();
        }
    }
}
