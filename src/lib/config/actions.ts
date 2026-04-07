'use server';

import { getPublicConfig, type PublicConfig } from '@/lib/config';

export async function fetchPublicConfig(): Promise<PublicConfig> {
  return getPublicConfig();
}
