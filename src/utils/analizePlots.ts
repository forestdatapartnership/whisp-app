import { NextResponse } from "next/server";
import path from "path";
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { analyze } from "@/utils/runPython";
import { PolygonCollection, PolygonFeature } from "@/types/geojson";

export const analyzePlots = async (payload: PolygonCollection | PolygonFeature) => {
    
    const token = uuidv4();
    const filePath = path.join(process.cwd(), 'temp');

    try {
        // Write the payload to a file
        await fs.writeFile(`${filePath}/${token}.json`, JSON.stringify(payload));

        // Attempt to analyze the plots
        const analyzed = await analyze(token);
        if (analyzed) {
            // Read and parse the analysis results
            const data = await fs.readFile(`${filePath}/${token}-result.json`, 'utf8');
            const jsonData = JSON.parse(data);
            return NextResponse.json(
                { data: jsonData, token: token }
            )
        } else {
            console.error(`Analysis failed for token: ${token}`);
            throw new Error("Analysis failed.");
        }
    } catch (error) {
        console.error(`Error processing analysis for ${token}:`, error);
        throw error;
    }
}
