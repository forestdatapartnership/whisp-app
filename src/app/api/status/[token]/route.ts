import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { ApiKey, ApiResponse } from "@/types/api";
import { SystemCode } from "@/types/systemCodes";
import { useResponse, useResponseWithFormat } from "@/lib/hooks/responses";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withLogging } from "@/lib/hooks/withLogging";
import { compose } from "@/lib/utils/compose";
import { LogFunction } from "@/lib/logger";
import { fileExists, readFile } from "@/lib/utils/fileUtils";
import { jobCache } from "@/lib/utils/jobCache";
import { withApiKey } from "@/lib/hooks/withApiKey";

export const GET = compose(
  withLogging,
  withErrorHandling,
  withApiKey
)(async (request: NextRequest, apiKey: ApiKey, log: LogFunction, { params }: any): Promise<NextResponse<ApiResponse>> => {
    const { token } = params;
    const filePath = path.join(process.cwd(), 'temp');
    const metadata = jobCache.get(token);
    
    // Check if result exists (analysis completed)
    if (await fileExists(`${filePath}/${token}-result.json`, log)) {
        const resultData = await readFile(`${filePath}/${token}-result.json`, log);
        const jsonData = JSON.parse(resultData);
        
        return useResponse(SystemCode.ANALYSIS_COMPLETED, jsonData, {
            token
        });
    }
    
    // Check if error exists (analysis failed)
    if (await fileExists(`${filePath}/${token}-error.json`, log)) {
        const errorData = await readFile(`${filePath}/${token}-error.json`, log);
        const errorInfo = JSON.parse(errorData);
        
        // Use the specific error code from the Python processor, or default to ANALYSIS_ERROR
        const errorCode = errorInfo.code || SystemCode.ANALYSIS_ERROR;
        
        // If the error has format arguments, use them
        if (errorInfo.formatArgs && Array.isArray(errorInfo.formatArgs)) {
            return useResponseWithFormat(errorCode, errorInfo.formatArgs);
        } else {
            return useResponse(errorCode);
        }
    }
    
    // Check if input exists (analysis was submitted and is processing)
    if (await fileExists(`${filePath}/${token}.json`, log)) {
        return useResponse(SystemCode.ANALYSIS_PROCESSING, {
            token,
            ...(metadata?.featureCount !== undefined && { featureCount: metadata.featureCount }),
            ...(metadata?.percent !== undefined && { percent: metadata.percent }),
            ...(metadata?.processStatusMessages !== undefined && { processStatusMessages: metadata.processStatusMessages })
        });
    }
    
    return useResponse(SystemCode.ANALYSIS_JOB_NOT_FOUND);

});
