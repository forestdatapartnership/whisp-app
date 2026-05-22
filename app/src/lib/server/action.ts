import 'server-only';
import { SystemError } from '@/types/system-error';
import { SystemCode } from '@/types/system-codes';
import type { ActionResult } from '@/types/action-result';

function isNextSentinel(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === 'string'
    && (digest.startsWith('NEXT_REDIRECT') || digest === 'NEXT_NOT_FOUND');
}

export function action<TArgs extends unknown[], T>(
  fn: (...args: TArgs) => Promise<T>,
): (...args: TArgs) => Promise<ActionResult<T>> {
  return async (...args) => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (err) {
      if (isNextSentinel(err)) throw err;
      if (err instanceof SystemError) {
        console.warn('[action]', err.systemCode, err.message, err.cause ?? '');
        return { ok: false, code: err.systemCode, args: err.formatArgs };
      }
      const e = err as Error;
      console.error('[action]', e?.message ?? String(err), e?.stack);
      return { ok: false, code: SystemCode.SYSTEM_INTERNAL_SERVER_ERROR };
    }
  };
}
