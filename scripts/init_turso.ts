import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
const dbToken = process.env.DATABASE_AUTH_TOKEN;

if (!dbUrl || !dbToken) {
  console.error('Missing DATABASE_URL or DATABASE_AUTH_TOKEN');
  process.exit(1);
}

const client = createClient({ url: dbUrl, authToken: dbToken });

async function main() {
  console.log('[DB] Connecting to Turso...');

  // Create laporan table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS laporan (
      id_laporan INTEGER PRIMARY KEY AUTOINCREMENT,
      kode_unik TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      tanggal TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      alamat TEXT,
      gambar TEXT NOT NULL,
      deskripsi TEXT,
      rds_score REAL NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      is_road TEXT DEFAULT 'true'
    )
  `);
  console.log('[DB] Table "laporan" created/verified');

  // Create deteksi table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS deteksi (
      id_deteksi INTEGER PRIMARY KEY AUTOINCREMENT,
      id_laporan INTEGER NOT NULL REFERENCES laporan(id_laporan),
      kelas TEXT NOT NULL,
      confidence_score REAL NOT NULL,
      bbox_x REAL NOT NULL,
      bbox_y REAL NOT NULL,
      bbox_width REAL NOT NULL,
      bbox_height REAL NOT NULL,
      image_index INTEGER DEFAULT 0 NOT NULL
    )
  `);
  console.log('[DB] Table "deteksi" created/verified');

  // Create indexes
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_deteksi_id_laporan ON deteksi(id_laporan)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_laporan_status ON laporan(status)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_laporan_tanggal ON laporan(tanggal)`);
  console.log('[DB] Indexes created/verified');

  // Verify
  const tables = await client.execute(`SELECT name FROM sqlite_master WHERE type='table'`);
  console.log('[DB] Tables:', tables.rows.map(r => r.name).join(', '));

  console.log('[DB] Done!');
}

main().catch(err => {
  console.error('[DB] Error:', err.message || err);
  process.exit(1);
});
