'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { SystemCode } from '@/types/system-codes';

export function useSystemMessage() {
  const t = useTranslations('SystemMessages');
  return useCallback(
    (code: SystemCode, args: (string | number)[] = []) =>
      t(code, Object.fromEntries(args.map((value, i) => [String(i), value]))),
    [t],
  );
}
