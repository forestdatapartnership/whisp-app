export function maskApiKey(key: string) {
  return key.length <= 8 ? '••••••••' : `${key.slice(0, 8)}••••••••${key.slice(-4)}`;
}
