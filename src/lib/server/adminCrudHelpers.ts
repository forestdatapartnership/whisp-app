import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import type { AuthUser } from '@/types/auth';

export async function runAdminMutation(
  fn: (user: AuthUser) => Promise<unknown>,
  paths: string[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireAdmin();
    await fn(user);
    paths.forEach((p) => revalidatePath(p));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed' };
  }
}
