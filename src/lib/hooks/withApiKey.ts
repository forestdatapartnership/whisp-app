import { NextResponse, NextRequest } from 'next/server';
import { validateApiKey } from '@/lib/utils/apiKeyValidator';
import { AnalysisJob } from '@/types/analysisJob';

export function withApiKey(
  handler: (req: NextRequest, context: AnalysisJob, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const [context, ...rest] = args;
    
    const apiKeyValidation = await validateApiKey(req);
    
    context.apiKeyId = apiKeyValidation.apiKeyId;
    context.userId = apiKeyValidation.userId;
    context.userEmail = apiKeyValidation.userEmail;
    context.maxConcurrentAnalyses = apiKeyValidation.maxConcurrentAnalyses;
    
    return handler(req, context, ...rest);
  };
}

