import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index";
import { laporan, deteksi } from "./src/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBaseUrl(): string {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.NODE_ENV === 'production') return 'https://jalur.example.com';
  return `http://localhost:${parseInt(process.env.PORT || '3000')}`;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

// Email configuration - falls back to Ethereal (test) if no SMTP env vars
let transporter: nodemailer.Transporter | null = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log(`[Email] Gmail SMTP configured — sending as ${process.env.SMTP_USER}`);
} else {
  nodemailer.createTestAccount().then(account => {
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });
    console.log("Test SMTP (Ethereal) configured — check console for email preview URLs.");
  }).catch(console.error);
}

// Normalize date to ISO string (handles Date objects, SQLite strings, ISO strings)
function toISO(tanggal: string | Date | null | undefined): string {
  if (!tanggal) return '';
  try {
    if (tanggal instanceof Date) return tanggal.toISOString();
    const d = new Date(tanggal);
    if (!isNaN(d.getTime())) return d.toISOString();
    // Try SQLite format fix: "2026-07-01 06:53:20" → "2026-07-01T06:53:20"
    const d2 = new Date(tanggal.replace(' ', 'T'));
    if (!isNaN(d2.getTime())) return d2.toISOString();
    return '';
  } catch {
    return '';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Menunggu';
    case 'reviewed': return 'Sedang Ditinjau';
    case 'dilaporkan': return 'Dilaporkan ke PU';
    case 'dalam_perbaikan': return 'Dalam Perbaikan';
    case 'perbaikan_selesai': return 'Perbaikan Selesai';
    case 'ditolak': return 'Ditolak';
    default: return status;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'reviewed': return '#3b82f6';
    case 'dilaporkan': return '#f59e0b';
    case 'dalam_perbaikan': return '#8b5cf6';
    case 'perbaikan_selesai': return '#22c55e';
    case 'ditolak': return '#ef4444';
    default: return '#6b7280';
  }
}

async function sendFeedbackEmail(toEmail: string, kodeUnik: string, reportId: number) {
  if (!transporter) return;
  try {
    const trackingUrl = `${getBaseUrl()}?track=${kodeUnik}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a8a; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fbbf24; margin: 0; font-size: 24px;">JALUR</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">Platform Monitoring Kerusakan Jalan</p>
        </div>
        <div style="background: #faf9f7; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e3a8a; margin: 0 0 16px;">Laporan Diterima!</h2>
          <p style="color: #374151; line-height: 1.6;">Terima kasih atas laporan Anda. Tim kami akan segera meninjaunya.</p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">KODE LAPORAN</p>
            <p style="margin: 0; font-size: 28px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.05em;">${kodeUnik}</p>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px;">Simpan kode ini untuk memantau status laporan Anda.</p>
          <a href="${trackingUrl}" style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Pantau Laporan</a>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 16px 0 0;">© 2026 JALUR · Proyek percontohan Kecamatan Kemang, Bogor</p>
      </div>
    `;
    const info = await transporter.sendMail({
      from: process.env.FEEDBACK_FROM_EMAIL || '"JALUR" <noreply@jalur.local>',
      to: toEmail,
      subject: `Laporan Diterima [${kodeUnik}] — JALUR`,
      html,
    });

    if (!process.env.SMTP_USER) {
      console.log(`[Email Preview] Feedback email sent. Preview: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      console.log(`[Email] Feedback sent to ${toEmail} for report ${kodeUnik}`);
    }
  } catch (err) {
    console.error("[Email] Failed to send feedback email:", err);
  }
}

async function sendPUReportEmail(report: {
  kode_unik: string;
  email: string;
  alamat: string | null;
  latitude: number;
  longitude: number;
  rds_score: number;
  tanggal: string | Date | null;
  deskripsi: string | null;
  gambar: string;
}, detections: { kelas: string; confidence_score: number }[]) {
  if (!transporter) return;
  try {
    const baseUrl = getBaseUrl();
    let imageHtml = '';
    try {
      const images = JSON.parse(report.gambar);
      if (Array.isArray(images) && images.length > 0) {
        imageHtml = images.slice(0, 3).map((img: string) =>
          `<img src="${img}" alt="Kerusakan jalan" style="width:120px;height:90px;object-fit:cover;border-radius:8px;margin-right:8px;" />`
        ).join('');
      }
    } catch {}

    const detectionList = detections.length > 0
      ? detections.map(d => `• ${d.kelas} (${Math.round(d.confidence_score * 100)}%)`).join('<br>')
      : 'Tidak ada deteksi kerusakan';

    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a8a; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fbbf24; margin: 0; font-size: 24px;">JALUR</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">Laporan Kerusakan Jalan — Dilaporkan ke PU</p>
        </div>
        <div style="background: #faf9f7; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">KODE LAPORAN</p>
            <p style="margin: 0 0 12px; font-size: 22px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.05em;">${report.kode_unik}</p>
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">TANGGAL</p>
            <p style="margin: 0 0 12px; color: #374151; font-size: 14px;">${toISO(report.tanggal) ? new Date(toISO(report.tanggal)).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'}</p>
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">LOKASI</p>
            <p style="margin: 0 0 12px; color: #374151; font-size: 14px;">${report.alamat || `Lat: ${report.latitude}, Lon: ${report.longitude}`}</p>
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">RDS SCORE</p>
            <p style="margin: 0 0 12px; font-size: 20px; font-weight: bold; color: ${report.rds_score < 40 ? '#dc2626' : report.rds_score < 70 ? '#f59e0b' : '#22c55e'};">${report.rds_score} / 100</p>
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">DAMPAK KERUSAKAN</p>
            <p style="margin: 0 0 12px; color: #374151; font-size: 14px;">${report.rds_score < 40 ? 'Parah — PRIORITAS TINGGI' : report.rds_score < 70 ? 'Sedang — PRIORITAS MENENGAH' : 'Ringan — PRIORITAS RENDAH'}</p>
            ${report.deskripsi ? `<p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">DESKRIPSI</p><p style="margin: 0 0 12px; color: #374151; font-size: 14px;">${report.deskripsi}</p>` : ''}
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">DETEKSI AI</p>
            <p style="margin: 0 0 12px; color: #374151; font-size: 14px;">${detectionList}</p>
          </div>
          ${imageHtml ? `<p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">FOTO</p><div style="margin-bottom: 16px;">${imageHtml}</div>` : ''}
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">Pelapor: <strong>${report.email}</strong></p>
          <p style="color: #6b7280; font-size: 13px; margin: 0;">Koordinat: ${report.latitude}, ${report.longitude}</p>
          <div style="margin-top: 16px; padding: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;">
            <p style="margin: 0; color: #92400e; font-size: 13px;">⚠️ Laporan ini telah ditinjau dan dianggap Valid oleh admin JALUR. Mohon ditindaklanjuti.</p>
          </div>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 16px 0 0;">© 2026 JALUR · Proyek percontohan Kecamatan Kemang, Bogor</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.FEEDBACK_FROM_EMAIL || '"JALUR" <noreply@jalur.local>',
      to: process.env.PU_EMAIL || 'pupr@gmail.com',
      subject: `[PU] Laporan Kerusakan Jalan [${report.kode_unik}] — RDS ${report.rds_score}`,
      html,
    });

    if (!process.env.SMTP_USER) {
      console.log(`[Email Preview] PU report email sent. Preview: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      console.log(`[Email] PU report sent to pupr@gmail.com for report ${report.kode_unik}`);
    }
  } catch (err) {
    console.error("[Email] Failed to send PU report email:", err);
  }
}

async function sendStatusUpdateEmail(toEmail: string, kodeUnik: string, newStatus: string) {
  if (!transporter) return;
  try {
    const statusLabel = getStatusLabel(newStatus);
    const statusColor = getStatusColor(newStatus);
    const trackingUrl = `${getBaseUrl()}?track=${kodeUnik}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a8a; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fbbf24; margin: 0; font-size: 24px;">JALUR</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">Platform Monitoring Kerusakan Jalan</p>
        </div>
        <div style="background: #faf9f7; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e3a8a; margin: 0 0 16px;">Status Laporan Diperbarui</h2>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">KODE LAPORAN</p>
            <p style="margin: 0 0 12px; font-size: 20px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.05em;">${kodeUnik}</p>
            <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">STATUS BARU</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${statusColor};">${statusLabel}</p>
          </div>
          <a href="${trackingUrl}" style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Lihat Detail</a>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 16px 0 0;">© 2026 JALUR · Proyek percontohan Kecamatan Kemang, Bogor</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.FEEDBACK_FROM_EMAIL || '"JALUR" <noreply@jalur.local>',
      to: toEmail,
      subject: `Update: Laporan [${kodeUnik}] — ${statusLabel}`,
      html,
    });

    if (!process.env.SMTP_USER) {
      console.log(`[Email Preview] Status update sent. Preview: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
      console.log(`[Email] Status update sent to ${toEmail} for report ${kodeUnik}: ${newStatus}`);
    }
  } catch (err) {
    console.error("[Email] Failed to send status update email:", err);
  }
}

async function getWilayahAddress(lat: number, lon: number): Promise<string> {
  try {
    // Implementing Wilayah / Administrative info fetch using Nominatim 
    // as an alternative since specific wilayah.id API requires auth/keys
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`, {
      headers: {
        'User-Agent': 'JALUR/1.0'
      }
    });
    if (response.ok) {
      const data = await response.json();
      return data.display_name || 'Tidak diketahui';
    }
  } catch (err) {
    console.error("Reverse geocode error:", err);
  }
  return 'Tidak diketahui';
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000');

  app.use(cors());
  app.use(express.json({ limit: '150mb' }));

  // API Routes
  app.get("/api/reports", async (req, res) => {
    try {
      if (!db) {
        return res.json([]); // Return empty if db not configured
      }

      const data = await db.select().from(laporan).orderBy(desc(laporan.tanggal));

      const reportsWithDetections = await Promise.all(data.map(async (report) => {
        const dets = await db!.select().from(deteksi).where(eq(deteksi.id_laporan, report.id_laporan));
        // map field names to match frontend types
        return {
          id: report.id_laporan,
          kodeUnik: report.kode_unik,
          email: report.email,
          createdAt: toISO(report.tanggal),
          latitude: report.latitude,
          longitude: report.longitude,
          imageUrl: report.gambar,
          deskripsi: report.deskripsi,
          rdsScore: report.rds_score,
          status: report.status,
          address: report.alamat,
          isRoadValid: report.is_road_valid ?? true,
          roadWarning: report.road_warning,
          detections: dets.map(d => ({
            class: d.kelas,
            confidence: d.confidence_score,
            image_index: d.image_index,
            bbox: { x: d.bbox_x, y: d.bbox_y, width: d.bbox_width, height: d.bbox_height }
          }))
        };
      }));

      res.json(reportsWithDetections);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // Load Kemang boundary from OSM
let kemangBoundary: number[][] = [];

try {
  const boundaryPath = path.join(process.cwd(), 'kemang-boundary.json');
  if (fs.existsSync(boundaryPath)) {
    const geojson = JSON.parse(fs.readFileSync(boundaryPath, 'utf-8'));
    // Handle both FeatureCollection and direct Feature/Polygon formats
    if (geojson.type === 'FeatureCollection' && geojson.features && geojson.features[0]) {
      kemangBoundary = geojson.features[0].geometry.coordinates[0];
    } else if (geojson.type === 'Feature' && geojson.geometry) {
      kemangBoundary = geojson.geometry.coordinates[0];
    } else if (geojson.type === 'Polygon') {
      kemangBoundary = geojson.coordinates[0];
    }
    console.log(`[Geofence] Loaded Kemang boundary with ${kemangBoundary.length} points`);
  } else {
    console.log('[Geofence] Boundary file not found, using fallback rectangle check');
  }
} catch (err) {
  console.error('[Geofence] Failed to load boundary:', err);
}

// Point-in-polygon using ray casting algorithm
function isPointInPolygon(lat: number, lon: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Updated geofencing function
function isWithinKemang(lat: number, lng: number): boolean {
  if (kemangBoundary.length > 0) {
    return isPointInPolygon(lat, lng, kemangBoundary);
  }
  // Fallback to rectangle if boundary not loaded
  return lat >= -6.5400 && lat <= -6.4850 && lng >= 106.7200 && lng <= 106.7800;
}

// Generate sequential K-codes: K-001, K-002, ...
async function generateKodeUnik(): Promise<string> {
  if (!db) return "K-001"; // fallback if DB not configured
  try {
    const [latest] = await db
      .select({ kode: laporan.kode_unik })
      .from(laporan)
      .where(sql`kode_unik GLOB 'K-[0-9]*'`)
      .orderBy(desc(laporan.id_laporan))
      .limit(1);

    let nextNum = 1;
    if (latest?.kode) {
      const num = parseInt(latest.kode.split('-')[1], 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    return `K-${String(nextNum).padStart(3, '0')}`;
  } catch {
    return "K-001"; // fallback on error
  }
}

  app.post("/api/reports", async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({ error: "Database not configured. Please add DATABASE_URL to .env" });
      }

      const { email, latitude, longitude, images, deskripsi } = req.body;

      // 1. Validate location
      if (!isWithinKemang(latitude, longitude)) {
        return res.status(400).json({ error: "Laporan ditolak. Hanya area Kecamatan Kemang, Kabupaten Bogor yang diperbolehkan." });
      }

      // 2. Generate kode unik dulu
      const kodeUnik = await generateKodeUnik();

      // 3. Road Classification (WAJIB - langkah pertama)
      const classifierUrl = "https://predict-6a49e64a402cf39ae6eb-dproatj77a-et.a.run.app/predict";
      const classifierApiKey = process.env.ROAD_CLASSIFIER_API_KEY;

      let isRoadValid = true;

      if (classifierApiKey && images && images.length > 0) {
        const firstImage = images[0];
        if (firstImage && firstImage.includes(",")) {
          const base64Data = firstImage.split(",")[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const blob = new Blob([buffer], { type: "image/jpeg" });

          const formData = new FormData();
          formData.append("file", blob, "image.jpg");
          formData.append("conf", "0.5");

          try {
            console.log(`[Classifier] Checking if image is road...`);
            const response = await fetch(classifierUrl, {
              method: "POST",
              headers: { "Authorization": `Bearer ${classifierApiKey}` },
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              console.log(`[Classifier] Response:`, JSON.stringify(data));

              // Parse response - assume format similar to YOLO
              const results = data.images?.[0]?.results || [];
              const detectedClass = results[0]?.name;
              const confidence = results[0]?.confidence || 0;

              console.log(`[Classifier] Detected: ${detectedClass}, confidence: ${confidence}`);

              // Check if it's road or non-road
              // "Jalanan" = road (valid), "Bukan Jalan" = non-road (reject)
              if (detectedClass === "Bukan Jalan" || confidence < 0.5) {
                // NON-ROAD - Return early, don't save
                console.log(`[Classifier] NON-ROAD detected - rejecting report`);
                return res.json({
                  success: true,
                  isRoadValid: false,
                  message: "Foto tidak terdeteksi sebagai jalanan. Silakan foto permukaan jalan."
                });
              }

              isRoadValid = true;
            }
          } catch (err) {
            console.error("[Classifier] Error:", err);
            // Graceful degradation - proceed to detection
          }
        }
      }

      // 4. YOLO Damage Detection (hanya kalau road valid)
      let rawDetections: any[] = [];
      const yoloUrl = "https://predict-69fefbdb869dd01551bd-dproatj77a-et.a.run.app/predict";
      const yoloApiKey = process.env.ULTRALYTICS_API_KEY;

      if (yoloApiKey && images && images.length > 0) {
        console.log(`[Detection] Starting YOLO damage detection...`);

        for (let i = 0; i < images.length; i++) {
          const imgData = images[i];
          if (!imgData || !imgData.includes(",")) continue;

          const base64Data = imgData.split(",")[1];
          const mimeType = imgData.split(";")[0].split(":")[1] || "image/jpeg";
          const buffer = Buffer.from(base64Data, 'base64');
          const blob = new Blob([buffer], { type: mimeType });

          const formData = new FormData();
          formData.append("file", blob, `image_${i}.jpg`);
          formData.append("conf", "0.25");
          formData.append("iou", "0.7");
          formData.append("imgsz", "640");

          try {
            const yoloResponse = await fetch(yoloUrl, {
              method: "POST",
              headers: { "Authorization": `Bearer ${yoloApiKey}` },
              body: formData,
            });

            if (yoloResponse.ok) {
              const yoloData = await yoloResponse.json() as any;
              if (yoloData.images && yoloData.images.length > 0) {
                const results = yoloData.images[0].results || [];
                const imageDetections = results.map((det: any) => {
                  const width = det.box.x2 - det.box.x1;
                  const height = det.box.y2 - det.box.y1;
                  return {
                    class: det.name || "unknown",
                    confidence: det.confidence,
                    image_index: i,
                    bbox: { x: det.box.x1, y: det.box.y1, width, height }
                  };
                });
                rawDetections = [...rawDetections, ...imageDetections];
              }
            }
          } catch (detErr) {
            console.error(`[Detection] Error on image ${i}:`, detErr);
          }
        }
      }

      // 5. Calculate RDS Score
      const weights: Record<string, number> = {
        'pothole': 10, 'linear crack': 5, 'alligator crack': 7
      };
      const penalty = rawDetections.reduce((acc: number, det: any) => acc + (weights[det.class] || 0), 0);
      const rdsScore = Math.max(0, 100 - penalty);
      console.log(`[Detection] RDS Score: ${rdsScore}, Detections: ${rawDetections.length}`);

      // 6. Get address
      const alamat = await getWilayahAddress(latitude, longitude);

      // 7. Save to DB
      const gambarStr = images ? JSON.stringify(images) : "[]";
      const [report] = await db.insert(laporan).values({
        kode_unik: kodeUnik,
        email,
        latitude,
        longitude,
        alamat,
        gambar: gambarStr,
        deskripsi,
        rds_score: rdsScore,
        tanggal: new Date().toISOString(),
        status: 'pending',
        is_road_valid: isRoadValid,
        road_warning: null
      }).returning();

      // 8. Save detections
      if (rawDetections.length > 0) {
        await db.insert(deteksi).values(rawDetections.map((d: any) => ({
          id_laporan: report.id_laporan,
          kelas: d.class,
          confidence_score: d.confidence,
          bbox_x: d.bbox.x,
          bbox_y: d.bbox.y,
          bbox_width: d.bbox.width,
          bbox_height: d.bbox.height,
          image_index: d.image_index || 0
        })));
      }

      // 9. Send email (non-blocking)
      sendFeedbackEmail(email, kodeUnik, report.id_laporan).catch(console.error);

      // 10. Return success
      console.log(`[Report] Created successfully: ${kodeUnik}`);
      res.json({
        success: true,
        isRoadValid: true,
        report: {
          id: report.id_laporan,
          kodeUnik: report.kode_unik,
          rdsScore,
          detections: rawDetections,
          address: alamat
        }
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Terjadi kesalahan. Silakan coba lagi." });
    }
  });

  app.post("/api/reports/:id/detect", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "No DB" });
      const { id } = req.params;
      
      const [report] = await db.select().from(laporan).where(eq(laporan.id_laporan, Number(id)));
      if (!report) return res.status(404).json({ error: "Report not found" });

      let rawDetections: any[] = [];
      const apiKey = process.env.ULTRALYTICS_API_KEY;
      if (!apiKey) {
        throw new Error("ULTRALYTICS_API_KEY is not set");
      }

      const yoloUrl = "https://predict-69fefbdb869dd01551bd-dproatj77a-et.a.run.app/predict";
      
      let images: string[] = [];
      try {
        images = JSON.parse(report.gambar);
        if (!Array.isArray(images)) images = [report.gambar];
      } catch (e) {
        images = [report.gambar];
      }

      for (let i = 0; i < images.length; i++) {
        const imgData = images[i];
        if (!imgData || !imgData.includes(",")) continue;

        const base64Data = imgData.split(",")[1];
        const mimeType = imgData.split(";")[0].split(":")[1] || "image/jpeg";
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: mimeType });

        const formData = new FormData();
        formData.append("file", blob, `image_${i}.jpg`);
        formData.append("conf", "0.25");
        formData.append("iou", "0.7");
        formData.append("imgsz", "640");

        try {
          const yoloResponse = await fetch(yoloUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
            },
            body: formData,
          });

          if (!yoloResponse.ok) {
            console.error(`Detection failed for image ${i}: ${yoloResponse.statusText}`);
            continue;
          }

          const yoloData = await yoloResponse.json() as any;
          
          if (yoloData.images && yoloData.images.length > 0) {
             const results = yoloData.images[0].results || [];
             const imageDetections = results.map((det: any) => {
               const width = det.box.x2 - det.box.x1;
               const height = det.box.y2 - det.box.y1;
               return {
                 class: det.name || "unknown",
                 confidence: det.confidence,
                 image_index: i,
                 bbox: {
                   x: det.box.x1,
                   y: det.box.y1,
                   width: width,
                   height: height
                 }
               };
             });
             rawDetections = [...rawDetections, ...imageDetections];
          }
        } catch (err) {
          console.error(`Error processing image ${i}`, err);
        }
      }

      const weights: Record<string, number> = {
        'pothole': 10,
        'linear crack': 5,
        'alligator crack': 7
      };
      
      const penalty = rawDetections.reduce((acc: number, det: any) => acc + (weights[det.class] || 0), 0);
      const rdsScore = Math.max(0, 100 - penalty);

      await db.update(laporan).set({ rds_score: rdsScore }).where(eq(laporan.id_laporan, Number(id)));

      if (rawDetections.length > 0) {
        await db.delete(deteksi).where(eq(deteksi.id_laporan, Number(id)));
        await db.insert(deteksi).values(rawDetections.map((d: any) => ({
          id_laporan: Number(id),
          kelas: d.class,
          confidence_score: d.confidence,
          bbox_x: d.bbox.x,
          bbox_y: d.bbox.y,
          bbox_width: d.bbox.width,
          bbox_height: d.bbox.height,
          image_index: d.image_index || 0
        })));
      }

      res.json({ success: true, rdsScore, detections: rawDetections });
    } catch (error: any) {
      console.error("Detect Endpoint Error:", error.message || error);
      res.status(400).json({ error: error.message || "Gagal melakukan deteksi kerusakan. Pastikan API Key valid atau server YOLO aktif." });
    }
  });

  app.put("/api/reports/:id/status", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "No DB" });
      const { id } = req.params;
      const { status } = req.body;

      // Get current report data before update
      const [report] = await db.select().from(laporan).where(eq(laporan.id_laporan, Number(id)));
      if (!report) return res.status(404).json({ error: "Report not found" });

      const oldStatus = report.status;
      await db.update(laporan).set({ status }).where(eq(laporan.id_laporan, Number(id)));

      // When status changes to 'dilaporkan', send email to PU
      if (oldStatus !== status && status === 'dilaporkan') {
        console.log(`[Status] Report ${report.kode_unik} → dilaporkan, sending PU email...`);
        const dets = await db.select().from(deteksi).where(eq(deteksi.id_laporan, Number(id)));
        sendPUReportEmail(report, dets)
          .then(() => console.log(`[Email] PU email sent successfully to ${process.env.PU_EMAIL || 'pupr@gmail.com'} for ${report.kode_unik}`))
          .catch(err => console.error(`[Email] PU email FAILED for ${report.kode_unik}:`, err.message || err));
      }

      // Send status update email to citizen (non-blocking)
      if (oldStatus !== status && report.email) {
        sendStatusUpdateEmail(report.email, report.kode_unik, status).catch(console.error);
      }

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.delete("/api/reports/:id", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "No DB" });
      const { id } = req.params;

      // Delete associated detections first (child records)
      await db.delete(deteksi).where(eq(deteksi.id_laporan, Number(id)));

      // Then delete the report itself
      await db.delete(laporan).where(eq(laporan.id_laporan, Number(id)));

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // Public tracking endpoint
  app.get("/api/reports/track/:kode", async (req, res) => {
    try {
      if (!db) return res.status(500).json({ error: "No DB" });
      const { kode } = req.params;
      const [report] = await db.select().from(laporan).where(eq(laporan.kode_unik, kode.toUpperCase()));
      if (!report) return res.status(404).json({ error: "Laporan tidak ditemukan" });

      const dets = await db.select().from(deteksi).where(eq(deteksi.id_laporan, report.id_laporan));
      res.json({
        kodeUnik: report.kode_unik,
        status: report.status,
        rdsScore: report.rds_score,
        createdAt: report.tanggal,
        address: report.alamat,
        detectionsCount: dets.length,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to track report" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: true,
        watch: {
          // Prevent Vite's file watcher from triggering reloads on IDE/AI tool state files
          ignored: [
            '**/.refact/**',
            '**/.qodo/**',
            '**/.gemini/**',
            '**/.git/**',
            '**/node_modules/**',
            '**/dist/**',
            '**/.claude/**',
            '**/.worktrees/**',
            '**/.cursor/**',
            '**/.windi/**',
          ],
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
