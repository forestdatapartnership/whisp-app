import { getPool } from '@/lib/dal/db';
import type { UserProfile } from '@/types/user';

const PROFILE_COLUMNS = 'uuid, name, last_name, organization, email, email_verified, is_admin';

export async function loginUser(email: string, password: string): Promise<UserProfile | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${PROFILE_COLUMNS} FROM login_user($1, $2)`,
    [email, password]
  );
  return result.rows[0] ?? null;
}

export async function registerUser(
  name: string,
  lastName: string,
  organization: string | null,
  email: string,
  password: string
): Promise<string> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT register_user($1, $2, $3, $4, $5) AS message',
    [name, lastName, organization, email, password]
  );
  return result.rows[0].message;
}

export async function getUserByUuid(uuid: string): Promise<UserProfile | null> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT ${PROFILE_COLUMNS} FROM users WHERE uuid = $1`,
    [uuid]
  );
  return result.rows[0] ?? null;
}

export async function updateUserProfile(
  uuid: string,
  data: { name: string; lastName: string; organization?: string | null }
): Promise<UserProfile | null> {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE users SET name = $1, last_name = $2, organization = $3
     WHERE uuid = $4
     RETURNING ${PROFILE_COLUMNS}`,
    [data.name, data.lastName, data.organization ?? null, uuid]
  );
  return result.rows[0] ?? null;
}

export async function verifyUserPassword(uuid: string, password: string): Promise<boolean> {
  const pool = getPool();
  const result = await pool.query(
    'SELECT verify_password($1, $2) AS is_valid',
    [uuid, password]
  );
  return result.rows[0]?.is_valid === true;
}

export async function changeUserPassword(uuid: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const pool = getPool();
  const emailResult = await pool.query('SELECT email FROM users WHERE uuid = $1', [uuid]);
  if (!emailResult.rowCount) return false;
  const result = await pool.query(
    'SELECT change_password($1, $2, $3) AS message',
    [emailResult.rows[0].email, currentPassword, newPassword]
  );
  return result.rows[0].message === 'Password changed successfully';
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<string> {
  const pool = getPool();
  const result = await pool.query('SELECT reset_password_with_token($1, $2)', [token, newPassword]);
  return result.rows[0].reset_password_with_token;
}

export async function insertVerificationToken(email: string, token: string, expiresAt: Date): Promise<void> {
  const pool = getPool();
  await pool.query('SELECT insert_email_verification_token($1, $2, $3)', [email, token, expiresAt]);
}

export async function createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<string> {
  const pool = getPool();
  const result = await pool.query('SELECT create_password_reset_token($1, $2, $3)', [email, token, expiresAt]);
  return result.rows[0].create_password_reset_token;
}

export async function deleteUser(uuid: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE analysis_jobs SET user_id = NULL, ip_address = NULL, api_key_id = NULL
     WHERE user_id = (SELECT id FROM users WHERE uuid = $1)`,
    [uuid]
  );
  await pool.query('DELETE FROM users WHERE uuid = $1', [uuid]);
}
