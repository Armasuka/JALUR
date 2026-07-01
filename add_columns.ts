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
    console.log("Adding columns to laporan table...");
    await sql`ALTER TABLE laporan ADD COLUMN IF NOT EXISTS kode_unik text UNIQUE`;
    await sql`ALTER TABLE laporan ADD COLUMN IF NOT EXISTS deskripsi text`;
    console.log("Columns added successfully!");
    
    // Update existing rows to have a kode_unik if they don't
    await sql`UPDATE laporan SET kode_unik = 'LAP' || id_laporan WHERE kode_unik IS NULL`;
    
    // Now make it NOT NULL
    await sql`ALTER TABLE laporan ALTER COLUMN kode_unik SET NOT NULL`;
    console.log("Set NOT NULL constraint on kode_unik!");
  } catch (err) {
    console.error("Failed to alter table:", err);
  } finally {
    await sql.end();
  }
};

runQuery();
