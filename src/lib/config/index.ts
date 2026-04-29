function env(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Required environment variable ${name} is not set`);
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function envOptional(name: string): string | undefined {
  return process.env[name] || undefined;
}

function envOptionalInt(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? undefined : parsed;
}

export const config = {
  db: {
    user: envOptional('DB_USER'),
    host: envOptional('DB_HOST'),
    name: envOptional('DB_NAME'),
    password: envOptional('DB_PASSWORD'),
    port: envInt('DB_PORT', 5432),
  },

  auth: {
    get jwtSecret() { return env('JWT_SECRET'); },
  },

  email: {
    service: envOptional('EMAIL_SERVICE'),
    user: envOptional('EMAIL_USER'),
    pass: envOptional('EMAIL_PASS'),
    hostUrl: (process.env.HOST_URL?.trim() || '').replace(/\/+$/, ''),
  },

  assetRegistry: {
    baseUrl: envOptional('ASSET_REGISTRY_BASE')?.replace(/\/$/, ''),
    defaultCatalog: env('ASSET_REGISTRY_DEFAULT_CATALOG', 'geoid'),
    defaultCollection: env('ASSET_REGISTRY_DEFAULT_COLLECTION', 'test_coll'),
  },

  analysis: {
    pythonPath: env('PYTHON_PATH', 'python'),
    pythonTimeoutMs: envInt('NEXT_PUBLIC_PYTHON_TIMEOUT_MS', 90000),
    pythonTimeoutSyncMs: envInt('NEXT_PUBLIC_PYTHON_TIMEOUT_SYNC_MS', 30000),
    geometryLimit: envInt('NEXT_PUBLIC_GEOMETRY_LIMIT', 1000),
    geometryLimitSync: envInt('NEXT_PUBLIC_GEOMETRY_LIMIT_SYNC', 300),
    asyncThreshold: envInt('NEXT_PUBLIC_ASYNC_THRESHOLD', 50),
  },

  app: {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
    whispPythonVersion: process.env.NEXT_PUBLIC_WHISP_PYTHON_VERSION || 'unknown',
    logLevel: env('NEXT_PUBLIC_LOG_LEVEL', 'info'),
    maxUploadFileSizeKb: envOptionalInt('NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE_KB'),
    googleMapsApiKey: envOptional('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'),
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim())) || [],
  },

  rateLimit: {
    windowMs: envInt('RATE_LIMIT_WINDOW_MS', 60000),
    maxRequests: envInt('RATE_LIMIT_MAX_REQUESTS', 30),
  },

  pii: {
    retentionDays: envInt('PII_RETENTION_DAYS', 90),
  },

};

export function getPublicConfig() {
  return {
    geometryLimit: config.analysis.geometryLimit,
    geometryLimitSync: config.analysis.geometryLimitSync,
    asyncThreshold: config.analysis.asyncThreshold,
    pythonTimeoutMs: config.analysis.pythonTimeoutMs,
    pythonTimeoutSyncMs: config.analysis.pythonTimeoutSyncMs,
    maxUploadFileSizeKb: config.app.maxUploadFileSizeKb,
    logLevel: config.app.logLevel,
    appVersion: config.app.version,
    whispPythonVersion: config.app.whispPythonVersion,
    assetRegistryDefaultCollection: config.assetRegistry.defaultCollection,
  };
}

export type PublicConfig = ReturnType<typeof getPublicConfig>;
