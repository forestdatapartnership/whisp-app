import { SystemCode } from '../systemCodes';
import { ApiKey } from '../api';
import type { BaseModel } from './base';


export interface AnalysisJob extends BaseModel {
  createdAt: Date;
  apiKey?: ApiKey;
  apiKeyId?: number; // TODO: placeholders for mappings for now, find a way to use the actual nested properties in the mapping without having to add them to the model
  userId?: number;
  featureCount?: number;
  analysisOptions?: any;
  status?: SystemCode;
  startedAt?: Date;
  completedAt?: Date;
  timeoutMs?: number;
  errorMessage?: string;
  resultsAvailable?: boolean;
  agent?: 'ui' | 'api';
  ipAddress?: string;
  apiVersion?: string;
  endpoint?: string;
  openforisWhispVersion?: string;
  earthengineApiVersion?: string;
}

