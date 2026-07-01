import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const runQuery = async () => {
  let dbUrl = process.env.DATABASE_URL as string;
  if (dbUrl && dbUrl.startsWith('DATABASE_URL=')) {
    dbUrl = dbUrl.replace('DATABASE_URL=', '').replace(/^["']|["']$/g, '');
  }
  if (dbUrl) {
    try {
      const match = dbUrl.match(/^(postgresql:\/\/[^:]+:)(.*)(@[^@]+:\d+\/.*)$/);
      if (match) {
        const part1 = match[1];
        let password = match[2];
        if (password.startsWith('[') && password.endsWith(']')) password = password.slice(1, -1);
        const part3 = match[3];
        dbUrl = part1 + encodeURIComponent(password) + part3;
      }
    } catch(e) {}
  }

  const sql = postgres(dbUrl, { max: 1 });

  try {
    console.log("Adding is_road column to laporan table...");
    await sql`ALTER TABLE laporan ADD COLUMN IF NOT EXISTS is_road text DEFAULT 'true'`;
    console.log("Column is_road added successfully!");
  } catch (err) {
    console.error("Failed to alter table:", err);
  } finally {
    await sql.end();
  }
};

runQuery();
