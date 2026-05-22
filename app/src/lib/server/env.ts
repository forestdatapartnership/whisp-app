import 'server-only';
import type { PublicConfig } from '@/lib/shared/public-config';

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
    get jwtSecret() {
      return env('JWT_SECRET');
    },
  },

  email: {
    service: envOptional('EMAIL_SERVICE'),
    user: envOptional('EMAIL_USER'),
    pass: envOptional('EMAIL_PASS'),
    from: envOptional('EMAIL_FROM') || '"Whisp" <whisp.openforis@gmail.com>',
    hostUrl: (process.env.HOST_URL?.trim() || '').replace(/\/+$/, ''),
  },

  api: {
    get url() {
      return env('API_URL').replace(/\/$/, '');
    },
  },

  geoid: {
    baseUrl: envOptional('GEOID_BASE')?.replace(/\/$/, ''),
    defaultCatalog: env('GEOID_DEFAULT_CATALOG', 'geoid'),
    defaultCollection: env('GEOID_DEFAULT_COLLECTION', 'test_coll'),
  },

  submission: {
    geometryLimit: envInt('NEXT_PUBLIC_GEOMETRY_LIMIT', 1000),
    asyncThreshold: envInt('NEXT_PUBLIC_ASYNC_THRESHOLD', 50),
  },

  app: {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
    whispPythonVersion: process.env.NEXT_PUBLIC_WHISP_PYTHON_VERSION || 'unknown',
    maxUploadFileSizeKb: envOptionalInt('NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE_KB'),
  },
};

export function getPublicConfig(): PublicConfig {
  return {
    apiUrl: config.api.url,
    geometryLimit: config.submission.geometryLimit,
    asyncThreshold: config.submission.asyncThreshold,
    maxUploadFileSizeKb: config.app.maxUploadFileSizeKb,
    appVersion: config.app.version,
    whispPythonVersion: config.app.whispPythonVersion,
    geoidDefaultCollection: config.geoid.defaultCollection,
  };
}
