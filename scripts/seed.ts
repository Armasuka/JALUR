/**
 * Database Seeding Script
 * Seeds sample laporan (reports) and deteksi (detections) with realistic Kemang area data
 * Run with: npm run db:seed
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { laporan, deteksi } from '../src/db/schema';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

let connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  console.error('❌ DATABASE_URL not set. Check your .env file.');
  process.exit(1);
}

// Sanitize connection string if prefixed with DATABASE_URL=
if (connectionString.startsWith('DATABASE_URL=')) {
  connectionString = connectionString.replace('DATABASE_URL=', '').replace(/^["']|["']$/g, '');
}

// Handle passwords with special characters
try {
  const match = connectionString.match(/^(postgresql:\/\/[^:]+:)(.*)(@[^@]+:\d+\/.*)$/);
  if (match) {
    let pwd = match[2];
    if (pwd.startsWith('[') && pwd.endsWith(']')) pwd = pwd.slice(1, -1);
    connectionString = match[1] + encodeURIComponent(pwd) + match[3];
  }
} catch (e) {
  // URL already valid
}

const sql = postgres(connectionString, { max: 5 });
const db = drizzle(sql, { schema: { laporan, deteksi } });

// Kemang area approximate bounding box (South Jakarta)
// South: -6.265, North: -6.230, West: 106.770, East: 106.815
const Kemang_BOUNDS = {
  latMin: -6.265,
  latMax: -6.230,
  lngMin: 106.770,
  lngMax: 106.815,
};

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface LaporanSeed {
  kode_unik: string;
  email: string;
  latitude: number;
  longitude: number;
  alamat: string;
  gambar: string;
  deskripsi: string;
  rds_score: number;
  status: 'pending' | 'reviewed' | 'diteruskan';
  deteksi?: {
    kelas: string;
    confidence_score: number;
    bbox_x: number;
    bbox_y: number;
    bbox_width: number;
    bbox_height: number;
  }[];
}

// Sample reports with realistic Kemang addresses and infrastructure data
const sampleLaporan: LaporanSeed[] = [
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'warga_kemang01@email.com',
    latitude: -6.2405,
    longitude: 106.7891,
    alamat: 'Jl. Kemang Raya No. 12, Kemang, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang01/800/600',
    deskripsi: 'Jalan berlubang besar di depan kompleks apartemen, sudah lebih dari 2 minggu belum diperbaiki. Berbahaya untuk pengguna jalan.',
    rds_score: 72,
    status: 'pending',
    deteksi: [{ kelas: 'pothole', confidence_score: 0.89, bbox_x: 120, bbox_y: 80, bbox_width: 200, bbox_height: 180 }],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'panitia_kemang02@email.com',
    latitude: -6.2432,
    longitude: 106.7855,
    alamat: 'Jl. Bangka Raya No. 8, Pela Mampang, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang02/800/600',
    deskripsi: 'Lampu jalan mati total di这段街区 (blok ini) sudah 10 hari. Keamanan menurun dan banyak lansia berisiko jatuh.',
    rds_score: 45,
    status: 'pending',
    deteksi: [],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'komunitas_jakarta@email.com',
    latitude: -6.2518,
    longitude: 106.7923,
    alamat: 'Jl. Ampera Raya, Ampera, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang03/800/600',
    deskripsi: 'Drainase tersumbat causing genangan air setinggi 30cm setiap hujan deras. Nyamuk meningkat drastis.',
    rds_score: 58,
    status: 'reviewed',
    deteksi: [
      { kelas: 'flooding', confidence_score: 0.76, bbox_x: 50, bbox_y: 200, bbox_width: 700, bbox_height: 250 },
    ],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'warga_sunter@email.com',
    latitude: -6.2389,
    longitude: 106.7967,
    alamat: 'Jl. Cipete Raya No. 45, Cipete, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang04/800/600',
    deskripsi: 'Dinding penahan tanah (talud) retak dan mau ambruk. Perlu perhatian segera قبل terjadi kecelakaan.',
    rds_score: 89,
    status: 'diteruskan',
    deteksi: [{ kelas: 'structural_crack', confidence_score: 0.92, bbox_x: 100, bbox_y: 50, bbox_width: 400, bbox_height: 500 }],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'petugas_satpol@email.go.id',
    latitude: -6.2471,
    longitude: 106.7812,
    alamat: 'Jl. Barito III, Barito, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang05/800/600',
    deskripsi: 'Pemasangan rambu lalu lintas baru — perlu penyegerakan dengan lampu pengatur tráfego di persimpangan.',
    rds_score: 33,
    status: 'pending',
    deteksi: [],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'relawan_banjir@email.com',
    latitude: -6.2556,
    longitude: 106.7889,
    alamat: 'Jl.这个小巷 Kemang Village, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang06/800/600',
    deskripsi: 'Genangan air kronis di gang kecil belakang pasar. Sudah 3 bulan. Perlu pompa air submersible.',
    rds_score: 66,
    status: 'reviewed',
    deteksi: [
      { kelas: 'flooding', confidence_score: 0.81, bbox_x: 80, bbox_y: 150, bbox_width: 640, bbox_height: 300 },
    ],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'dinas_blueprint@email.go.id',
    latitude: -6.2423,
    longitude: 106.8015,
    alamat: 'Jl. TB Simatupang Km. 5, Cilandak, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang07/800/600',
    deskripsi: 'Kerusakan trotoar berbahaya. Besi cor terbuka, immediately dangerous. Perlu police line segera.',
    rds_score: 91,
    status: 'diteruskan',
    deteksi: [{ kelas: 'sidewalk_damage', confidence_score: 0.87, bbox_x: 200, bbox_y: 300, bbox_width: 400, bbox_height: 150 }],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'pengurus_rt07@kemang.net',
    latitude: -6.2534,
    longitude: 106.7778,
    alamat: 'Jl. Pangeran Antasari No. 22, Antasari, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang08/800/600',
    deskripsi: 'Kabel listrik menjuntai ke bawah dekat trotoar. Bahaya listrik尤其是 setelah hujan.',
    rds_score: 77,
    status: 'pending',
    deteksi: [{ kelas: 'dangling_wire', confidence_score: 0.83, bbox_x: 250, bbox_y: 20, bbox_width: 300, bbox_height: 400 }],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'pemberi_rekening1@email.com',
    latitude: -6.2445,
    longitude: 106.8056,
    alamat: 'Jl. Ragunan Km. 2, Pasar Minggu, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang09/800/600',
    deskripsi: 'Rambu deviasi (pengalihan) terbalik arah. Justru menyulitkan. Harusnya di seberang街.',
    rds_score: 28,
    status: 'pending',
    deteksi: [],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'warga_kemang10@email.com',
    latitude: -6.2498,
    longitude: 106.7845,
    alamat: 'Jl. Trunojoyo No. 1, Menteng, Jakarta Pusat (dekat Kemang)',
    gambar: 'https://picsum.photos/seed/kemang10/800/600',
    deskripsi: 'Bronjong penahan Kali Blitz sudah eroded. Kalau banjir besar bisa kolaps whole section.',
    rds_score: 85,
    status: 'diteruskan',
    deteksi: [
      { kelas: 'erosion', confidence_score: 0.78, bbox_x: 0, bbox_y: 350, bbox_width: 800, bbox_height: 200 },
      { kelas: 'structural_crack', confidence_score: 0.65, bbox_x: 300, bbox_y: 250, bbox_width: 200, bbox_height: 300 },
    ],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'pengusaha_kemang@email.com',
    latitude: -6.2412,
    longitude: 106.7917,
    alamat: 'Jl. Kemang Timur No. 88, Kemang, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang11/800/600',
    deskripsi: 'Parkir liar占用 badan jalan, kendaraan besar susah lewat尤其 pagi & sore rush hours.',
    rds_score: 41,
    status: 'reviewed',
    deteksi: [],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'satgas_banjir@email.go.id',
    latitude: -6.2589,
    longitude: 106.7890,
    alamat: 'Jl.这个小巷 8, Kemang Village Apartment, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang12/800/600',
    deskripsi: 'Pompa air di titik genangan sudah 2 minggu mati. Sudah dilaporkan ke lodge tapi belum ada tindakan.',
    rds_score: 63,
    status: 'pending',
    deteksi: [{ kelas: 'equipment_failure', confidence_score: 0.71, bbox_x: 300, bbox_y: 200, bbox_width: 200, bbox_height: 200 }],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'ok到此为止@email.com',
    latitude: -6.2467,
    longitude: 106.7989,
    alamat: 'Jl. Charun blok D-12, Cipete, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang13/800/600',
    deskripsi: 'Jalan Retak Séismik (crack pattern diagonal across整个路面). Perlu overlay segera sebelum melebar.',
    rds_score: 54,
    status: 'pending',
    deteksi: [
      { kelas: 'pothole', confidence_score: 0.67, bbox_x: 150, bbox_y: 100, bbox_width: 500, bbox_height: 250 },
      { kelas: 'crack', confidence_score: 0.73, bbox_x: 50, bbox_y: 80, bbox_width: 700, bbox_height: 60 },
    ],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'dinas_pub@email.go.id',
    latitude: -6.2378,
    longitude: 106.7934,
    alamat: 'Jl. Ceylon No. 5, Kemang, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang14/800/600',
    deskripsi: 'Kanstin (kerb) pecah dan sharp edges — luka open di trotoar, bahaya bagi пешеходы dan anak-anak.',
    rds_score: 48,
    status: 'reviewed',
    deteksi: [{ kelas: 'sidewalk_damage', confidence_score: 0.79, bbox_x: 220, bbox_y: 280, bbox_width: 360, bbox_height: 120 }],
  },
  {
    kode_unik: `LPR-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: 'rt003_rw07@kemang.id',
    latitude: -6.2601,
    longitude: 106.7811,
    alamat: 'Jl.这个小巷 Dalam No. 3, Kemang, Jakarta Selatan',
    gambar: 'https://picsum.photos/seed/kemang15/800/600',
    deskripsi: 'Pipa PDAM bocor (bawah trotoar). Air muncrat ke Atas especially di malam hari. Tekanan drop for penghuni atas.',
    rds_score: 56,
    status: 'pending',
    deteksi: [{ kelas: 'pipe_leak', confidence_score: 0.74, bbox_x: 400, bbox_y: 150, bbox_width: 150, bbox_height: 350 }],
  },
];

console.log('🌱 Seeding database...\n');

async function seed() {
  console.log('📊 Sample reports to insert:', sampleLaporan.length);
  console.log('');

  try {
    let insertedCount = 0;
    let detectionCount = 0;

    for (const item of sampleLaporan) {
      const existingReports = await db
        .select()
        .from(laporan)
        .where(eq(laporan.kode_unik, item.kode_unik))
        .limit(1);

      if (existingReports.length > 0) {
        console.log(`⏭️  Skipping ${item.kode_unik} — already exists`);
        continue;
      }

      // Insert laporan
      const result = await db.insert(laporan).values({
        kode_unik: item.kode_unik,
        email: item.email,
        latitude: item.latitude,
        longitude: item.longitude,
        alamat: item.alamat,
        gambar: item.gambar,
        deskripsi: item.deskripsi,
        rds_score: item.rds_score,
        status: item.status,
      }).returning({ id_laporan: laporan.id_laporan });

      const idLaporan = result[0].id_laporan;
      insertedCount++;

      // Insert detections for this report
      if (item.deteksi && item.deteksi.length > 0) {
        for (const det of item.deteksi) {
          await db.insert(deteksi).values({
            id_laporan: idLaporan,
            kelas: det.kelas,
            confidence_score: det.confidence_score,
            bbox_x: det.bbox_x,
            bbox_y: det.bbox_y,
            bbox_width: det.bbox_width,
            bbox_height: det.bbox_height,
          });
          detectionCount++;
        }
      }

      console.log(
        `✅ Inserted: ${item.kode_unik} | RDS: ${item.rds_score}/100 | Status: ${item.status} | Detections: ${item.deteksi?.length ?? 0}`
      );
    }

    console.log('\n──────────────');
    console.log(`✅ Seeding complete!`);
    console.log(`   Laporan inserted: ${insertedCount}`);
    console.log(`   Deteksi inserted: ${detectionCount}`);
    console.log('──────────────\n');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seed();
