<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LAJUR — LAPOR JALAN UNTUK RAKYAT

Sistem pelaporan dan monitoring kerusakan jalan berbasis web menggunakan deteksi AI (YOLOv11) dan Road Damage Score (RDS) untuk Kecamatan Kemang, Kabupaten Bogor.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, Tailwind CSS 4 |
| Maps | React Leaflet, Leaflet.heat |
| Backend | Express.js, TypeScript |
| Database | Turso (libSQL/SQLite) via Drizzle ORM |
| AI | Google Gemini API, Ultralytics YOLO API |
| Storage | Supabase (auth + storage) |
| Email | Nodemailer (SMTP) |
| PDF | jsPDF + html2canvas |
| Testing | Vitest |
| Deployment | Google Cloud Run |

## Features

- **Report Submission** — Laporan kerusakan jalan dengan foto, lokasi otomatis (GPS), dan deteksi AI otomatis
- **AI Detection** — Deteksi pothole, linear crack, alligator crack menggunakan YOLOv11
- **Road Damage Score (RDS)** — Skor 0-100 berdasarkan severity dan density kerusakan
- **Road Classifier** — Filter otomatis: hanya jalan yang divalidasi, bukan trotoar/taman
- **Public Tracking** — Lacak status laporan via kode unik tanpa login
- **Heatmap** — Visualisasi sebaran kerusakan jalan
- **Priority View** — Daftar kerusakan berdasarkan RDS score
- **Admin Dashboard** — Kelola laporan, update status, generate laporan PDF
- **Email Notification** — Status update dikirim via email ke pelapor dan Dinas PU
- **Export PDF** — Generate laporan kerusakan dalam format PDF

## Project Structure

```
├── server.ts              # Express API server
├── server.test.ts         # API tests
├── drizzle.config.ts      # Drizzle ORM config
├── vite.config.ts         # Vite build config
├── tsconfig.json          # TypeScript config
├── scripts/               # One-off scripts
│   ├── migrate.ts         # Database migration
│   ├── seed.ts            # Seed data
│   ├── init_turso.ts      # Turso setup
│   └── migrate-*.ts       # Schema migrations
├── drizzle/               # Drizzle migrations
│   └── meta/
│       ├── _journal.json
│       └── *_snapshot.json
└── src/
    ├── App.tsx            # Main app
    ├── main.tsx           # Entry point
    ├── index.css          # Global styles
    ├── components/        # React components
    │   ├── icons/         # Icon system
    │   ├── Dashboard.tsx
    │   ├── MapDisplay.tsx
    │   ├── ReportForm.tsx
    │   └── ... (20+ components)
    ├── db/
    │   ├── schema.ts      # Drizzle schema
    │   └── index.ts       # DB client
    ├── lib/
    │   ├── utils.ts       # Utilities
    │   └── useCountUp.tsx # Animated counter hook
    ├── data/
    │   ├── kemang.json
    │   └── kemangPolygon.json
    └── types/
        ├── index.ts       # Re-exports
        ├── report.ts      # Report types
        └── leaflet.heat.d.ts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | List all reports (admin) |
| `POST` | `/api/reports` | Submit new report |
| `POST` | `/api/reports/:id/detect` | Run AI detection on report image |
| `PUT` | `/api/reports/:id/status` | Update report status |
| `DELETE` | `/api/reports/:id` | Delete report |
| `GET` | `/api/reports/track/:kode` | Track report by unique code |

## Database Schema

### `laporan` (Reports)

| Column | Type | Description |
|--------|------|-------------|
| `id_laporan` | INTEGER | Primary key, auto-increment |
| `kode_unik` | TEXT | Unique tracking code |
| `email` | TEXT | Reporter email |
| `tanggal` | TEXT | Submission timestamp |
| `latitude` | REAL | GPS latitude |
| `longitude` | REAL | GPS longitude |
| `alamat` | TEXT | Reverse geocoded address |
| `gambar` | TEXT | Image URL/path |
| `deskripsi` | TEXT | Optional description |
| `rds_score` | REAL | Road Damage Score (0-100) |
| `status` | TEXT | pending/reviewed/dilaporkan/dalam_perbaikan/perbaikan_selesai/ditolak |
| `is_road_valid` | INTEGER | Boolean: is this a valid road location |
| `road_warning` | TEXT | Warning if not on road |

### `deteksi` (Detections)

| Column | Type | Description |
|--------|------|-------------|
| `id_deteksi` | INTEGER | Primary key, auto-increment |
| `id_laporan` | INTEGER | FK to laporan |
| `kelas` | TEXT | pothole/linear crack/alligator crack |
| `confidence_score` | REAL | AI confidence (0-1) |
| `bbox_x` | REAL | Bounding box x |
| `bbox_y` | REAL | Bounding box y |
| `bbox_width` | REAL | Bounding box width |
| `bbox_height` | REAL | Bounding box height |
| `image_index` | INTEGER | Image index if multiple |

## Setup

### Prerequisites

- Node.js 18+
- [Turso CLI](https://turso.tech/tutorials/getting-started) (optional, for local dev)
- [Firebase project](https://console.firebase.google.com) (for storage)

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Turso database URL |
| `DATABASE_AUTH_TOKEN` | Turso auth token |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `ULTRALYTICS_API_KEY` | Ultralytics API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SMTP_*` | SMTP email config |
| `VITE_ADMIN_EMAIL` | Admin login email |
| `VITE_ADMIN_PASSWORD` | Admin login password |
| `PU_EMAIL` | Target email for reports |

### 3. Database Setup

```bash
# Generate migration from schema
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

App runs at `http://localhost:3000`

## Scripts

```bash
npm run dev          # Start dev server (watch mode)
npm run build         # Build for production
npm run build:full    # Build + migrate
npm run preview       # Preview production build
npm run lint          # TypeScript check
npm run test          # Run tests
npm run test:watch    # Watch tests
npm run test:coverage # Coverage report
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database
npm run db:studio     # Open Drizzle Studio
npm run clean         # Remove dist folder
```

## Deployment

### Google Cloud Run

```bash
npm run deploy
```

Requires:
- Google Cloud SDK (`gcloud`)
- Docker (for local build) OR Cloud Run source deploy

## License

MIT
