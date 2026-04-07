import { Pool } from 'pg';
import { config } from '@/lib/config';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;

  pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.name,
    password: config.db.password,
    port: config.db.port,
  });

  pool.on('error', (err) => {
    console.error('Unexpected idle client error in pg pool', err);
  });

  return pool;
}
