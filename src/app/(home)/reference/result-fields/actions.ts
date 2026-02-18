'use server';

import { runAdminMutation } from '@/lib/server/adminCrudHelpers';
import {
  createResultField,
  updateResultField,
  deleteResultField,
} from '@/lib/dal/resultFieldsService';
import type { ResultField } from '@/types/models';

const REVALIDATE_PATHS = ['/api/result-fields', '/reference/result-fields'];

export async function createResultFieldAction(
  field: Omit<ResultField, 'updatedAt' | 'updatedBy'>
): Promise<{ ok: boolean; error?: string }> {
  return runAdminMutation((user) => createResultField(field, user.email), REVALIDATE_PATHS);
}

export async function updateResultFieldAction(
  code: string,
  updates: Partial<ResultField>
): Promise<{ ok: boolean; error?: string }> {
  return runAdminMutation((user) => updateResultField(code, updates, user.email), REVALIDATE_PATHS);
}

export async function deleteResultFieldAction(code: string): Promise<{ ok: boolean; error?: string }> {
  return runAdminMutation(() => deleteResultField(code), REVALIDATE_PATHS);
}
