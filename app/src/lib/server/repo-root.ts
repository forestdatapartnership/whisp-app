import path from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export const REPO_ROOT = path.resolve(APP_ROOT, '..');
