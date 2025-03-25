import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  max: Number(process.env.DB_MAX) || 20, // Maximum number of connections in the pool
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000, // 30 seconds before closing idle clients
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT) || 2000, // 2 seconds to establish a connection
});

export default pool;

