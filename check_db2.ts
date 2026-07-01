import { db } from "./src/db/index";
import { laporan } from "./src/db/schema";
import { desc } from "drizzle-orm";

async function checkDb() {
  const reports = await db.select({
    id: laporan.id_laporan,
    kode_unik: laporan.kode_unik,
    len: laporan.gambar
  }).from(laporan).orderBy(desc(laporan.tanggal));
  
  console.log(reports.map(r => ({ id: r.id, len: r.len?.length })));
  process.exit(0);
}
checkDb();
