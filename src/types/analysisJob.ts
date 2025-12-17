import { SystemCode } from './systemCodes';
import { ApiKey } from './api';


export interface AnalysisJob {
  token: string;
  createdAt: Date;
  apiKey?: ApiKey;
  featureCount?: number;
  analysisOptions?: any;
  status?: SystemCode;
  startedAt?: Date;
  completedAt?: Date;
  timeoutMs?: number;
  errorMessage?: string;
  resultsAvailable?: boolean;
}

