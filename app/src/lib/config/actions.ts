'use server';

import { getPublicConfig } from '@/lib/server/env';
import { action } from '@/lib/server/action';
import type { PublicConfig } from '@/lib/shared/public-config';

export const fetchPublicConfig = action(async (): Promise<PublicConfig> => getPublicConfig());
