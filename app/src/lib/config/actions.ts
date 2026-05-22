'use server';

import { getClientConfig } from '@/lib/server/env';
import { action } from '@/lib/server/action';

export type { ClientConfig } from '@/lib/server/env';

export const fetchPublicConfig = action(getClientConfig);
