import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export function readAppVersion(): string {
  if (process.env.NEXT_PUBLIC_APP_VERSION) {
    return process.env.NEXT_PUBLIC_APP_VERSION;
  }
  try {
    return fs.readFileSync(path.join(repoRoot, '.version'), 'utf-8').trim() || '0.0.0';
  } catch {
    return '0.0.0';
  }
}
