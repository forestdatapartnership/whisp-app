export type PublicConfig = {
  geometryLimit: number;
  geometryLimitSync: number;
  asyncThreshold: number;
  pythonTimeoutMs: number;
  pythonTimeoutSyncMs: number;
  maxUploadFileSizeKb: number | undefined;
  logLevel: string;
  appVersion: string;
  whispPythonVersion: string;
  assetRegistryDefaultCollection: string;
};
