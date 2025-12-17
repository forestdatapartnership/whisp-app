import { SystemCode } from '@/types/systemCodes';

export interface ApiResponse<T = any> {
  code?: SystemCode;     
  message?: string;     
  data?: T;
  context?: Record<string, any>;
}

export interface ApiKey {
  key?: string;
  keyId?: number;
  userId?: number;
  userEmail?: string;
  maxConcurrentAnalyses?: number;
}