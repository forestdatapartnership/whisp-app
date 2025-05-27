import { Pool } from 'pg';
import { Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let pool: Pool | null = null;

async function getDbPassword(): Promise<string | undefined> {
  if (process.env.DB_PASSWORD) return process.env.DB_PASSWORD;
  if (!process.env.GCP_PROJECT_ID || !process.env.SECRET_NAME) return;

  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${process.env.SECRET_NAME}/versions/latest`,
  });

  return version.payload?.data?.toString();
}

export async function getPool(): Promise<Pool> {
  if (pool) return pool;

  const password = await getDbPassword();

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
      password,
    });
  } else {
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password,
      port: Number(process.env.DB_PORT),
    });
  }

  return pool;
}
