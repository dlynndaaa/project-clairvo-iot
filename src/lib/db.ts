import { Pool, type PoolClient } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'clairvo_iot',
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
