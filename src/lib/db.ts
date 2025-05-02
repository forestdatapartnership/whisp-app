// /src/lib/db.ts
import { Pool } from 'pg';
import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';

let pool: Pool | null = null;

export async function getPool(): Promise<Pool> {
  if (pool) return pool;

  if (process.env.DB_CONNECTION_TYPE === 'cloudsql') {
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME!,
      ipType: IpAddressTypes.PUBLIC,
    });
    pool = new Pool({
      ...clientOpts, 
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'whisp',
    });
  } else {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'whisp',
      password: process.env.DB_PASSWORD || 'password',
      port: Number(process.env.DB_PORT) || 5432,
    });
  }

  return pool;
}
