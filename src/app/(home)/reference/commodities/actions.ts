'use server';

import { runAdminMutation } from '@/lib/server/adminCrudHelpers';
import {
  createCommodity,
  updateCommodity,
  deleteCommodity,
} from '@/lib/dal/commoditiesService';
import type { Commodity } from '@/types/models';

const REVALIDATE_PATHS = ['/api/commodities', '/reference/commodities'];

export async function createCommodityAction(
  data: Omit<Commodity, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Promise<{ ok: boolean; error?: string }> {
  return runAdminMutation((user) => createCommodity({ ...data, createdBy: user.email }), REVALIDATE_PATHS);
}

export async function updateCommodityAction(
  code: string,
  updates: Partial<Pick<Commodity, 'description'>>
): Promise<{ ok: boolean; error?: string }> {
  return runAdminMutation((user) => updateCommodity(code, { ...updates, updatedBy: user.email }), REVALIDATE_PATHS);
}

export async function deleteCommodityAction(code: string): Promise<{ ok: boolean; error?: string }> {
  return runAdminMutation(() => deleteCommodity(code), REVALIDATE_PATHS);
}
