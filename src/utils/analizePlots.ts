import { NextResponse } from "next/server";
import path from "path";
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { analyze } from "@/utils/runPython";

export const analyzePlots = async (payload: any) => {

    const token = uuidv4();
    const filePath = path.join(process.cwd(), 'temp');

    let fileHandle;
    try {
        // Write the payload to a file
        await fs.writeFile(`${filePath}/${token}.json`, JSON.stringify(payload));

        console.log("Starting analysis: ", token);

        // Attempt to analyze the plots
        const analyzed = await analyze(token);
 
        if (analyzed) {
            // Read and parse the analysis results
            fileHandle = await fs.open(`${filePath}/${token}-result.json`, 'r'); // Explicitly open the file
            const fileContents = await fileHandle.readFile('utf8'); 
             const jsonData = JSON.parse(fileContents);
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
    } finally {
        // Explicitly close the file handle if it was opened
        if (fileHandle) {
            fileHandle.close();
        }
    }
}
