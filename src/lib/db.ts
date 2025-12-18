import { Pool } from 'pg';

// Deklarasi global agar TypeScript tidak komplain
declare global {
  var postgresPool: Pool | undefined;
}

const config = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'clairvo_iot',
};

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  // Di production, buat pool baru biasa
  pool = new Pool(config);
} else {
  // Di development, cek apakah sudah ada pool global?
  if (!global.postgresPool) {
    global.postgresPool = new Pool(config);
  }
  pool = global.postgresPool;
}

// Listener error (Penting agar server tidak crash jika koneksi putus)
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool