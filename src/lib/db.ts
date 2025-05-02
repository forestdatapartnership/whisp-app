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
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    });
  } else {
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    });
  }

  return pool;
}
