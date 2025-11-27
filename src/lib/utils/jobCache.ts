import NodeCache from 'node-cache';

interface JobMetadata {
  featureCount: number;
  startTime?: number;
  pythonStartTime?: number;
  finishTime?: number;
  percent?: number;
  processStatusMessages?: string[];
}

class JobCache {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 24 * 60 * 60,
      checkperiod: 60 * 60,
      useClones: false
    });
  }

  set(token: string, metadata: JobMetadata): void {
    this.cache.set(token, metadata);
  }

  get(token: string): JobMetadata | null {
    const value = this.cache.get<JobMetadata>(token);
    return value || null;
  }

  delete(token: string): void {
    this.cache.del(token);
  }

  clear(): void {
    this.cache.flushAll();
  }
}

export const jobCache = new JobCache();

