import 'server-only';
import { getPool } from '@/lib/db/pool';

export async function subscribeNotifications(email: string): Promise<void> {
  const pool = getPool();
  await pool.query('SELECT subscribe_notifications($1)', [email]);
}

export async function unsubscribeNotifications(email: string): Promise<void> {
  const pool = getPool();
  await pool.query('SELECT unsubscribe_notifications($1)', [email]);
}
