import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
const dbToken = process.env.DATABASE_AUTH_TOKEN;

// In preview without env vars, this might fail, so we wrap it
let dbClient: ReturnType<typeof drizzle> | null = null;

if (dbUrl) {
  try {
    const client = createClient({
      url: dbUrl,
      authToken: dbToken,
    });
    dbClient = drizzle(client, { schema });
    console.log('[DB] Connected to Turso (SQLite)');
  } catch (e) {
    console.log('[DB] Failed to initialize database, check DATABASE_URL / DATABASE_AUTH_TOKEN');
  }
} else {
  console.log('[DB] DATABASE_URL not set — database disabled');
}

export const db = dbClient;
