import type { SystemCode } from './system-codes';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; code: SystemCode; args?: (string | number)[] };
