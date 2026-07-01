import { db } from "./src/db/index";
import { laporan } from "./src/db/schema";
import { desc } from "drizzle-orm";

async function checkDb() {
  const reports = await db.select({
    id: laporan.id_laporan,
    kode_unik: laporan.kode_unik,
    email: laporan.email,
    tanggal: laporan.tanggal
  }).from(laporan).orderBy(desc(laporan.tanggal)).limit(5);
  console.log(reports);
  process.exit(0);
}
checkDb();
