import type { SystemCode } from './systemCodes';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; code: SystemCode; args?: (string | number)[] };
