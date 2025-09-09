import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from "path";
import { ApiResponse } from "@/types/api";
import { SystemCode } from "@/types/systemCodes";
import { useResponse } from "@/lib/hooks/responses";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (request: NextRequest, log: LogFunction, { params }: any): Promise<NextResponse<ApiResponse>> => {
    const { token } = params;
    const filePath = path.join(process.cwd(), 'temp');
    
    // Check if result exists (analysis completed)
    if (await fileExists(`${filePath}/${token}-result.json`)) {
        const resultData = await fs.readFile(`${filePath}/${token}-result.json`, 'utf8');
        const jsonData = JSON.parse(resultData);
        
        return useResponse(SystemCode.ANALYSIS_COMPLETED, jsonData);
    }
    
    // Check if error exists (analysis failed)
    if (await fileExists(`${filePath}/${token}-error.json`)) {
        const errorData = await fs.readFile(`${filePath}/${token}-error.json`, 'utf8');
        const errorInfo = JSON.parse(errorData);
        
        // Use the specific error code from the Python processor, or default to ANALYSIS_ERROR
        const errorCode = errorInfo.code || SystemCode.ANALYSIS_ERROR;
        
        // If the error has format arguments, use them
        if (errorInfo.formatArgs && Array.isArray(errorInfo.formatArgs)) {
            return useResponse(errorCode, errorInfo.formatArgs);
        } else {
            return useResponse(errorCode);
        }
    }
    
    // Check if input exists (analysis was submitted and is processing)
    if (await fileExists(`${filePath}/${token}.json`)) {
        return useResponse(SystemCode.ANALYSIS_PROCESSING);
    }
    
    return useResponse(SystemCode.ANALYSIS_JOB_NOT_FOUND);

});

const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};