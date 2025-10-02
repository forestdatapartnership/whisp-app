import { PublicConfig } from '../contexts/ConfigContext';

function getEnvironmentVariable(key: string): string | undefined {
  return process.env[key];
}

export function getConfig(
  config: PublicConfig | undefined,
  key: string
): string | undefined;
export function getConfig(
  config: PublicConfig | undefined,
  key: string,
  defaultValue: string
): string;
export function getConfig(
  config: PublicConfig | undefined,
  key: string,
  defaultValue?: string
): string | undefined {
  return getEnvironmentVariable(key) || config?.[key] || defaultValue;
}

export function getMaxFileSize(config?: PublicConfig): number | undefined {
  const value = getConfig(config, 'NEXT_PUBLIC_MAX_UPLOAD_FILE_SIZE_KB');
  return value ? Number(value) * 1024 : undefined;
}

export function getMaxGeometryLimit(config?: PublicConfig): number {
  const value = getConfig(config, 'NEXT_PUBLIC_GEOMETRY_LIMIT', '1000');
  return parseInt(value, 10);
}

export function getMaxGeometryLimitSync(config?: PublicConfig): number {
  const value = getConfig(config, 'NEXT_PUBLIC_GEOMETRY_LIMIT_SYNC', '300');
  return parseInt(value, 10);
}

export function getMaxRequestSizeMB(config?: PublicConfig): number | undefined {
  const maxFileSizeBytes = getMaxFileSize(config);
  return maxFileSizeBytes ? Math.round(maxFileSizeBytes / (1024 * 1024) * 100) / 100 : undefined;
}

export function getPythonTimeoutMs(config?: PublicConfig): number {
  const value = getConfig(config, 'NEXT_PUBLIC_PYTHON_TIMEOUT_MS', '90000');
  return parseInt(value, 10);
}

export function getPythonTimeoutSyncMs(config?: PublicConfig): number {
  const value = getConfig(config, 'NEXT_PUBLIC_PYTHON_TIMEOUT_SYNC_MS', '30000');
  return parseInt(value, 10);
}

export function getProcessingTimeoutSeconds(config?: PublicConfig): number {
  const value = getPythonTimeoutMs(config);
  return Math.round(value / 1000);
}

export function getProcessingTimeoutSyncSeconds(config?: PublicConfig): number {
  const value = getPythonTimeoutSyncMs(config);
  return Math.round(value / 1000);
}

export function getLogLevel(config?: PublicConfig): string {
  return getConfig(config, 'NEXT_PUBLIC_LOG_LEVEL', 'info');
}

export function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0'; // bundled at build time in next.config.js
}

export function getGoogleMapsApiKey(config?: PublicConfig): string | undefined {
  return getConfig(config, 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
}

export function getUIClientSecret(config?: PublicConfig): string {
  return getConfig(config, 'NEXT_PUBLIC_UI_CLIENT_SECRET', 'whisp-ui-client-access');
}
