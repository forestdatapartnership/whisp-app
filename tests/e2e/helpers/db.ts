import pg from 'pg';

function getPool() {
  return new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });
}

export async function verifyUserEmail(email: string) {
  const pool = getPool();
  try {
    const result = await pool.query(
      `UPDATE users SET email_verified = TRUE WHERE email = $1 RETURNING email`,
      [email]
    );
    if (result.rowCount === 0) {
      throw new Error(`User not found: ${email}`);
    }
    return result.rows[0].email;
  } finally {
    await pool.end();
  }
}

export async function deleteUserByEmail(email: string) {
  const pool = getPool();
  try {
    await pool.query(`DELETE FROM users WHERE email = $1`, [email]);
  } finally {
    await pool.end();
  }
}

export async function getAnalysisJobStats(tokens: string[]) {
  if (!tokens.length) return [];
  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT aj.id, aj.status, aj.feature_count, aj.endpoint,
              u.email,
              aj.created_at, aj.started_at, aj.completed_at,
              EXTRACT(EPOCH FROM (aj.started_at - aj.created_at)) * 1000 AS queue_ms,
              EXTRACT(EPOCH FROM (aj.completed_at - aj.started_at)) * 1000 AS processing_ms,
              EXTRACT(EPOCH FROM (aj.completed_at - aj.created_at)) * 1000 AS total_ms
       FROM analysis_jobs aj
       LEFT JOIN users u ON u.id = aj.user_id
       WHERE aj.id = ANY($1::uuid[])`,
      [tokens]
    );
    return result.rows;
  } finally {
    await pool.end();
  }
}

export async function userExists(email: string): Promise<boolean> {
  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT 1 FROM users WHERE email = $1`,
      [email]
    );
    return (result.rowCount ?? 0) > 0;
  } finally {
    await pool.end();
  }
}
