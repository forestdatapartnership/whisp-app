'use server';

import { headers } from 'next/headers';
import { getAuthUserWithRefresh } from '@/lib/auth/session';
import { action } from '@/lib/server/action';
import { insertFeedback } from '@/lib/db/feedback-service';
import { FEEDBACK_QUESTIONS, FEEDBACK_TEXT_MAX_LENGTH } from '@/lib/feedback/questions';
import { SystemError } from '@/types/system-error';
import { SystemCode } from '@/types/system-codes';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_TOTAL = 200;
const ALL_IPS = '*';
const attempts = new Map<string, { count: number; firstAttempt: number }>();
let lastSweep = Date.now();

async function clientIp(): Promise<string> {
  // Google's load balancer appends "<client-ip>,<load-balancer-ip>"; anything before them is sent by the client.
  const forwarded = ((await headers()).get('x-forwarded-for') ?? '').split(',').map((ip) => ip.trim());
  return forwarded.at(-2) ?? forwarded[0];
}

function checkRateLimit(key: string, max: number): void {
  const now = Date.now();
  if (now - lastSweep >= WINDOW_MS) {
    for (const [k, record] of attempts) {
      if (now - record.firstAttempt >= WINDOW_MS) attempts.delete(k);
    }
    lastSweep = now;
  }
  const record = attempts.get(key);
  if (!record || now - record.firstAttempt >= WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return;
  }
  if (record.count >= max) {
    throw new SystemError(
      SystemCode.AUTH_RATE_LIMIT_EXCEEDED,
      [Math.ceil((record.firstAttempt + WINDOW_MS - now) / 1000)]
    );
  }
  record.count += 1;
}

export const submitFeedback = action(async (answers: Record<string, string>): Promise<void> => {
  checkRateLimit(await clientIp(), MAX_PER_IP);
  checkRateLimit(ALL_IPS, MAX_TOTAL);

  const valid: Record<string, string> = {};
  for (const { name, options } of FEEDBACK_QUESTIONS) {
    const value = answers?.[name];
    if (typeof value !== 'string') continue;
    // Postgres text can't store NUL characters.
    const answer = value.replaceAll('\0', '').trim().slice(0, FEEDBACK_TEXT_MAX_LENGTH);
    if (answer && (!options || options.includes(answer))) valid[name] = answer;
  }
  if (Object.keys(valid).length === 0) {
    throw new SystemError(SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS, ['answers']);
  }

  const user = await getAuthUserWithRefresh();
  await insertFeedback(valid, user?.id ?? null);
});
