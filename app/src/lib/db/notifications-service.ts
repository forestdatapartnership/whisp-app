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

export async function getNotificationSubscription(email: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT subscribed FROM notification_subscriptions WHERE email = $1',
    [email]
  );
  return result.rows[0]?.subscribed === true;
}
