/**
 * Database Migration Runner Script
 * Alternative way to run migrations using drizzle-kit CLI via tsx
 * Run with: npm run db:migrate
 *
 * This script delegates to drizzle-kit for actual migration execution.
 * Use `npm run db:generate` to create migrations from schema changes,
 * then `npm run db:migrate` to apply them.
 */

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

// Check DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not set in .env — cannot connect to database.');
  console.error('   Copy .env.example to .env and set your DATABASE_URL.');
  process.exit(1);
}

const dialect = 'sqlite';

console.log('🔄 Running migrations with drizzle-kit...\n');

try {
  execSync(`npx drizzle-kit migrate --config drizzle.config.ts`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
    },
  });
  console.log('\n✅ Migrations applied successfully!');
} catch (err) {
  console.error('\n❌ Migration failed. Check your DATABASE_URL and try again.');
  console.error('   Use `npm run db:generate` first to create migration files.');
  process.exit(1);
}
