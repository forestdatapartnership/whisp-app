const PREFIX = 'whisp-sync:';

export function storeSyncResult(token: string, data: unknown) {
  try {
    sessionStorage.setItem(`${PREFIX}${token}`, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function readSyncResult(token: string): unknown | null {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${token}`);
    if (!raw) return null;
    sessionStorage.removeItem(`${PREFIX}${token}`);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
