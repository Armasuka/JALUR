import { db } from "./src/db/index";
import { laporan, deteksi } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function cleanup() {
  try {
    await db.delete(deteksi).where(eq(deteksi.id_laporan, 9));
    await db.delete(deteksi).where(eq(deteksi.id_laporan, 8));
    await db.delete(laporan).where(eq(laporan.id_laporan, 9));
    await db.delete(laporan).where(eq(laporan.id_laporan, 8));
    console.log("Deleted large reports");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
cleanup();
