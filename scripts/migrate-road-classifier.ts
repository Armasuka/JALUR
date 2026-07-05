import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function migrate() {
  console.log('Running migration...');

  try {
    await db.executeMultiple(`
      ALTER TABLE laporan ADD COLUMN is_road_valid INTEGER DEFAULT 1;
      ALTER TABLE laporan ADD COLUMN road_warning TEXT;
    `);
    console.log('✅ Migration completed successfully!');
  } catch (err: any) {
    if (err.message?.includes('duplicate column')) {
      console.log('⚠️ Columns already exist, skipping...');
    } else {
      console.error('❌ Migration failed:', err.message);
      process.exit(1);
    }
  }
}

migrate();
