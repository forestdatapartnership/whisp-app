import type { SystemCode } from '@/types/system-codes';

export interface ApiResponse<T = unknown> {
  code?: SystemCode;     
  message?: string;     
  cause?: string;
  data?: T;
  context?: Record<string, unknown>;
}

export interface ApiKey {
  key?: string;
  keyId?: number;
  userId?: number;
  userEmail?: string;
  maxConcurrentAnalyses?: number;
}

export interface ApiKeyMetadata {
  id: number;
  userId: number;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
}