import { SystemCode } from './systemCodes';

export interface AnalysisJob {
  token: string;
  createdAt: Date;
  apiKeyId?: number;
  userId?: number;
  userEmail?: string;
  maxConcurrentAnalyses?: number;
  featureCount?: number;
  analysisOptions?: any;
  status?: SystemCode;
  startedAt?: Date;
  completedAt?: Date;
  timeoutMs?: number;
  errorMessage?: string;
  resultsAvailable?: boolean;
}

