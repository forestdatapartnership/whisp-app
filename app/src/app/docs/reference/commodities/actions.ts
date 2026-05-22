'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import {
  getAllCommodities,
  createCommodity as dalCreate,
  updateCommodity as dalUpdate,
  deleteCommodity as dalDelete,
} from '@/lib/db/commodities-service';
import { action } from '@/lib/server/action';
import type { Commodity } from '@/types/models';

const REVALIDATE_PATHS = ['/docs/reference/commodities', '/docs/reference/result-fields'];

export const getCommodities = action(async () => {
  return getAllCommodities();
});

export const createCommodity = action(async (data: Omit<Commodity, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => {
  const user = await requireAdmin();
  const result = await dalCreate({ ...data, createdBy: user.email });
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
  return result;
});

export const updateCommodity = action(async (id: string, updates: Partial<Commodity>) => {
  const user = await requireAdmin();
  const result = await dalUpdate(id, { ...updates, updatedBy: user.email });
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
  return result;
});

export const deleteCommodity = action(async (id: string) => {
  await requireAdmin();
  await dalDelete(id);
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
});
