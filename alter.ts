import { db } from "./src/db/index";
import { sql } from "drizzle-orm";

async function alterDb() {
  try {
    await db.execute(sql`ALTER TABLE deteksi ADD COLUMN IF NOT EXISTS image_index INTEGER NOT NULL DEFAULT 0;`);
    console.log("Column added successfully");
  } catch (err) {
    console.error("Error adding column:", err);
  }
  process.exit(0);
}

alterDb();
