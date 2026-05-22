import 'server-only';

import { cache } from 'react';
import { readAppVersion } from '@/lib/app-version';

type ApiConfigResponse = {
  maxRequestBodySizeKb?: number | null;
  geometryLimitSync?: number;
  geometryLimitAsync?: number;
  openforisWhispVersion?: string;
  geoidBaseUrl?: string | null;
  geoidCatalog?: string | null;
  geoidCollection?: string | null;
};

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
  const raw = envOptional(name);
  if (!raw) return undefined;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? undefined : parsed;
}

function geometryLimit(data: ApiConfigResponse): number | undefined {
  const { geometryLimitSync, geometryLimitAsync } = data;
  if (geometryLimitSync == null && geometryLimitAsync == null) return undefined;
  return Math.max(geometryLimitSync ?? 0, geometryLimitAsync ?? 0);
}

function applyRemoteConfig(data: ApiConfigResponse) {
  if (data.geoidBaseUrl) process.env.GEOID_BASE_URL = data.geoidBaseUrl;
  if (data.geoidCatalog) process.env.GEOID_CATALOG = data.geoidCatalog;
  if (data.geoidCollection) process.env.GEOID_COLLECTION = data.geoidCollection;
  if (data.openforisWhispVersion) process.env.OPENFORIS_WHISP_VERSION = data.openforisWhispVersion;
  if (data.maxRequestBodySizeKb != null) {
    process.env.MAX_REQUEST_BODY_SIZE_KB = String(data.maxRequestBodySizeKb);
  }
  const limit = geometryLimit(data);
  if (limit != null) process.env.GEOMETRY_LIMIT = String(limit);
  syncRemoteConfig();
}

function syncRemoteConfig() {
  config.geoid.baseUrl = envOptional('GEOID_BASE_URL')?.replace(/\/$/, '');
  config.geoid.catalog = envOptional('GEOID_CATALOG');
  config.geoid.collection = envOptional('GEOID_COLLECTION');
  config.app.openforisWhispVersion = envOptional('OPENFORIS_WHISP_VERSION') ?? '';
  config.submission.maxRequestBodySizeKb = envOptionalInt('MAX_REQUEST_BODY_SIZE_KB');
  config.submission.geometryLimit = envOptionalInt('GEOMETRY_LIMIT');
}

const loadRemote = cache(async () => {
  try {
    const res = await fetch(`${config.api.url}/config`, { cache: 'no-store' });
    if (res.ok) applyRemoteConfig((await res.json()) as ApiConfigResponse);
  } catch {}
});

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
    baseUrl: envOptional('GEOID_BASE_URL')?.replace(/\/$/, ''),
    catalog: envOptional('GEOID_CATALOG'),
    collection: envOptional('GEOID_COLLECTION'),
    async collectionsUrl() {
      await loadRemote();
      if (!config.geoid.baseUrl || !config.geoid.catalog) return undefined;
      return `${config.geoid.baseUrl}/catalog/features/catalogs/${encodeURIComponent(config.geoid.catalog)}/collections`;
    },
  },

  submission: {
    asyncThreshold: envInt('NEXT_PUBLIC_ASYNC_THRESHOLD', 50),
    geometryLimit: envOptionalInt('GEOMETRY_LIMIT'),
    maxRequestBodySizeKb: envOptionalInt('MAX_REQUEST_BODY_SIZE_KB')
  },

  app: {
    version: readAppVersion(),
    openforisWhispVersion: envOptional('OPENFORIS_WHISP_VERSION') ?? ''
  },
};

export async function getClientConfig() {
  await loadRemote();
  return {
    api: config.api,
    app: config.app,
    submission: config.submission,
    geoid: { collection: config.geoid.collection },
  };
}

export type ClientConfig = Awaited<ReturnType<typeof getClientConfig>>;
