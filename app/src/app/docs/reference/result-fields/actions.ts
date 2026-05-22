'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/session';
import {
  getAllResultFields,
  createResultField as dalCreate,
  updateResultField as dalUpdate,
  deleteResultField as dalDelete,
} from '@/lib/db/result-fields-service';
import { action } from '@/lib/server/action';
import type { ResultField } from '@/types/models';

const REVALIDATE_PATHS = ['/docs/reference/result-fields'];

export const getResultFields = action(async () => {
  return getAllResultFields();
});

export const createResultField = action(async (
  data: Omit<ResultField, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
) => {
  const user = await requireAdmin();
  const result = await dalCreate({ ...data, createdBy: user.email });
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
  return result;
});

export const updateResultField = action(async (id: string, updates: Partial<ResultField>) => {
  const user = await requireAdmin();
  const result = await dalUpdate(id, { ...updates, updatedBy: user.email });
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
  return result;
});

export const deleteResultField = action(async (id: string) => {
  await requireAdmin();
  await dalDelete(id);
  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
});
