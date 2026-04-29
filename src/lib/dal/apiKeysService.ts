import { getPool } from '@/lib/dal/db';
import { randomUUID } from 'crypto';

const API_KEY_EXPIRY_DAYS = 365;

type ApiKeyRow = {
  apiKey: string;
  createdAt: string | null;
  expiresAt: string | null;
};

export type ApiKeyLookupRow = {
  id: number;
  user_id: number;
  user_email: string;
  rate_limit_window_ms: number | null;
  rate_limit_max_requests: number | null;
  max_concurrent_analyses: number | null;
};

export async function findApiKey(key: string): Promise<ApiKeyLookupRow | null> {
  const pool = getPool();
  const result = await pool.query<ApiKeyLookupRow>(
    'SELECT id, user_id, user_email, rate_limit_window_ms, rate_limit_max_requests, max_concurrent_analyses FROM find_api_key($1)',
    [key]
  );
  return result.rows[0] ?? null;
}

export async function getApiKeyByUser(userId: string): Promise<ApiKeyRow | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ak.api_key AS "apiKey", ak.created_at AS "createdAt", ak.expires_at AS "expiresAt"
     FROM api_keys ak
     INNER JOIN users u ON ak.user_id = u.id
     WHERE u.uuid = $1 AND revoked = false AND expires_at > NOW()`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function createApiKeyForUser(userId: string): Promise<ApiKeyRow> {
  const pool = getPool();
  const key = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * API_KEY_EXPIRY_DAYS);

  const result = await pool.query(
    `SELECT api_key AS "apiKey", created_at AS "createdAt", expires_at AS "expiresAt"
     FROM create_or_replace_api_key($1, $2, $3)`,
    [userId, key, expiresAt]
  );
  return result.rows[0];
}

export async function deleteApiKeyByUser(userId: string): Promise<void> {
  const pool = getPool();
  await pool.query('SELECT delete_api_key_by_user($1)', [userId]);
}

export async function getTempApiKey(): Promise<{ apiKey: string; expiresAt: string | null }> {
  const pool = getPool();
  const result = await pool.query('SELECT * FROM get_temp_api_key()');
  const row = result.rows[0];

  if (!row) {
    throw new Error('Failed to generate temporary API key');
  }

  return {
    apiKey: row.api_key,
    expiresAt: row.expires_at ?? null,
  };
}
