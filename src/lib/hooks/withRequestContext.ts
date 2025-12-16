import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisJob } from '@/types/analysisJob';

export function withAnalysisJobContext(
  handler: (req: NextRequest, context: AnalysisJob, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const token = uuidv4();
    const createdAt = new Date();
    
    const context: AnalysisJob = {
      token,
      createdAt
    };
    
    return handler(req, context, ...args);
  };
}

