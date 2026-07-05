# Road Classifier Filter — Design Spec

## Overview

Menambahkan validasi "jalan atau bukan" sebagai langkah pertama saat user menekan tombol Kirim. AI mendeteksi terlebih dahulu, baru kemudian menentukan apakah laporan valid atau bukan.

## Flow (Revisi)

```
Klik "Kirim Laporan"
    ↓
Tampilkan: "AI Sedang Menganalisis..." (Loading State)
    ↓
Step 1: Road Classification
    ↓
    ├─ NON-ROAD → Langsung tampilkan state "Bukan Jalan"
    │               (Tidak disimpan ke DB, RDS = null)
    │
    └─ ROAD → Step 2: YOLO Damage Detection
                   ↓
              Hitung RDS Score
                   ↓
              Simpan ke DB
                   ↓
              Tampilkan "Laporan Terkirim" + RDS Score
```

## States

### Frontend States (ReportForm)

| State | Kondisi |
|-------|---------|
| `idle` | Default, form siap isi |
| `analyzing` | Klik Kirim, AI sedang mendeteksi |
| `success` | Road + Detected → Laporan tersimpan |
| `not-road` | Non-road terdeteksi → Tidak tersimpan |
| `error` | Error umum |

## Model Classifier

- **URL:** `https://predict-6a49e64a402cf39ae6eb-dproatj77a-et.a.run.app/predict`
- **API Key:** dari env `ROAD_CLASSIFIER_API_KEY`
- **Logic:** Jika `class === "road"` → valid. Jika `class !== "road"` atau confidence < 0.5 → non-road

## Backend Changes (`server.ts`)

### Endpoint: `POST /api/reports`

Ubah flow dari sync-then-background jadi fully-sync:

```typescript
app.post("/api/reports", async (req, res) => {
  try {
    const { email, latitude, longitude, images, deskripsi } = req.body;

    // 1. Validate location
    if (!isWithinKemang(latitude, longitude)) {
      return res.status(400).json({ 
        error: "Laporan ditolak. Hanya area Kecamatan Kemang, Kabupaten Bogor yang diperbolehkan." 
      });
    }

    // 2. Generate kode unik dulu
    const kodeUnik = await generateKodeUnik();

    // 3. Road Classification (WAJIB - langkah pertama)
    const classifierUrl = "https://predict-6a49e64a402cf39ae6eb-dproatj77a-et.a.run.app/predict";
    const classifierApiKey = process.env.ROAD_CLASSIFIER_API_KEY;
    
    let isRoadValid = true;
    
    if (classifierApiKey && images.length > 0) {
      const firstImage = images[0];
      if (firstImage && firstImage.includes(",")) {
        const base64Data = firstImage.split(",")[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: "image/jpeg" });

        const formData = new FormData();
        formData.append("file", blob, "image.jpg");
        formData.append("conf", "0.5");

        try {
          const response = await fetch(classifierUrl, {
            method: "POST",
            headers: { "Authorization": `Bearer ${classifierApiKey}` },
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            const detectedClass = data.images?.[0]?.results?.[0]?.name;
            const confidence = data.images?.[0]?.results?.[0]?.confidence || 0;

            if (detectedClass !== "road" || confidence < 0.5) {
              // NON-ROAD - Return early, don't save
              return res.json({
                success: true,
                isRoadValid: false,
                message: "Foto tidak terdeteksi sebagai jalanan. Silakan foto permukaan jalan."
              });
            }
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

    if (yoloApiKey && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imgData = images[i];
        if (!imgData || !imgData.includes(",")) continue;

        const base64Data = imgData.split(",")[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: "image/jpeg" });

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
            const yoloData = await yoloResponse.json();
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

    // 6. Get address
    const alamat = await getWilayahAddress(latitude, longitude);

    // 7. Save to DB
    const [report] = await db.insert(laporan).values({
      kode_unik: kodeUnik,
      email,
      latitude,
      longitude,
      alamat,
      gambar: JSON.stringify(images),
      deskripsi,
      rds_score: rdsScore,
      tanggal: new Date().toISOString(),
      status: 'pending',
      is_road_valid: true,
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

    // 9. Send email
    await sendFeedbackEmail(email, kodeUnik, report.id_laporan);

    // 10. Return success
    res.json({
      success: true,
      isRoadValid: true,
      report: {
        id: report.id_laporan,
        kodeUnik: report.kode_unik,
        rdsScore,
        detections: rawDetections
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Terjadi kesalahan. Silakan coba lagi." });
  }
});
```

### Database Schema

Tambah kolom di tabel `laporan`:
- `is_road_valid` (boolean, default: true)
- `road_warning` (text, nullable)

## Frontend Changes (`ReportForm.tsx`)

### State Changes

```typescript
const [status, setStatus] = useState<'idle' | 'analyzing' | 'success' | 'not-road' | 'error'>('idle');
const [isRoadValid, setIsRoadValid] = useState<boolean | null>(null);
const [roadWarning, setRoadWarning] = useState<string | null>(null);
const [rdsScore, setRdsScore] = useState<number | null>(null);
const [detections, setDetections] = useState<any[]>([]);
const [resultImages, setResultImages] = useState<string[]>([]);
```

### handleSubmit Changes

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (files.length === 0 || !email) return;

  setLoading(true);
  setStatus('analyzing'); // Ubah dari 'saving'
  setErrorMsg(null);
  setRdsScore(null);
  setDetections([]);
  setResultImages([]);
  setIsRoadValid(null);

  try {
    // ... compress & geolocation ...

    if (!isWithinKemang(latitude, longitude)) {
      throw new Error("Laporan ditolak. Hanya area Kecamatan Kemang, Kabupaten Bogor.");
    }

    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, latitude, longitude, images: imagesPayload, deskripsi })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'API Error');

    // Check if non-road
    if (data.isRoadValid === false) {
      setStatus('not-road');
      setRoadWarning(data.message);
      return;
    }

    // Success - road valid
    setKodeUnik(data.report.kodeUnik);
    setRdsScore(data.report.rdsScore);
    setDetections(data.report.detections || []);
    setIsRoadValid(true);
    
    // Set result images from previews (or from response if available)
    setResultImages(imagesPayload);
    
    setStatus('success');
    if (onSuccess) onSuccess();

  } catch (error: any) {
    setErrorMsg(error.message || 'Terjadi kesalahan saat menyimpan laporan.');
    setStatus('error');
  } finally {
    setLoading(false);
  }
};
```

### UI: Analyzing State

Tambah komponen loading saat `status === 'analyzing'`:

```tsx
{status === 'analyzing' && (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="card p-12 flex flex-col items-center text-center space-y-4"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-20 h-20 rounded-full flex items-center justify-center"
      style={{ background: 'var(--color-brand-blue-50)' }}
    >
      <BrainCircuit className="w-10 h-10" style={{ color: 'var(--color-brand-blue)' }} />
    </motion.div>
    <h3 className="display-serif text-xl" style={{ color: 'var(--color-brand-blue)' }}>
      AI Sedang Menganalisis...
    </h3>
    <p className="text-sm" style={{ color: 'var(--color-on-surface-muted)' }}>
      Mendeteksi permukaan jalan dan kerusakan
    </p>
  </motion.div>
)}
```

### UI: Not-Road State

Tambah komponen saat `status === 'not-road'`:

```tsx
{status === 'not-road' && (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="card overflow-hidden"
  >
    <div className="p-8 text-center" style={{ background: 'linear-gradient(180deg, #fef2f2 0%, white 100%)' }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-4"
      >
        <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
          <circle cx="40" cy="40" r="38" fill="#ef4444"/>
          <path d="M28 28L52 52M52 28L28 52" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        </svg>
      </motion.div>
      <span className="eyebrow block mb-2" style={{ color: '#dc2626' }}>
        Bukan Jalan
      </span>
      <p className="display-serif text-2xl" style={{ color: '#1e3a8a' }}>
        Foto Tidak Valid
      </p>
      <p className="text-sm mt-3" style={{ color: 'var(--color-on-surface-muted)' }}>
        {roadWarning || "Foto tidak terdeteksi sebagai jalanan. Silakan foto permukaan jalan."}
      </p>
    </div>
    <div className="p-6">
      <div className="rounded-2xl p-4 mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#991b1b' }}>
              Laporan Tidak Tersimpan
            </p>
            <p className="text-xs mt-1" style={{ color: '#7f1d1d' }}>
              Silakan ambil foto baru yang menunjukkan permukaan jalan.
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          setStatus('idle');
          setFiles([]);
          setPreviews([]);
          setDeskripsi('');
        }}
        className="btn-primary w-full"
      >
        Coba Lagi
      </button>
    </div>
  </motion.div>
)}
```

### SuccessCard Update

Update SuccessCard untuk terima props:

```tsx
const SuccessCard = ({ rdsScore, detections, kodeUnik, onNavigateHistory }: SuccessCardProps) => (
  // ... existing code ...
);
```

## Env Variables

Tambah di `.env`:
```
ROAD_CLASSIFIER_API_KEY=ul_4c283c1ebeca35bd5313ddb467f75c8442714bcc
```

## Error Handling

- Jika classifier API gagal → graceful degradation, proceed ke YOLO (anggap valid)
- Jika YOLO API gagal → tetap simpan laporan dengan RDS = 100 (no detection)
- Jika DB gagal → return error, user bisa retry

## Test Cases

| # | Input | Expected Result |
|---|-------|-----------------|
| 1 | Foto jalan + ada kerusakan | "Laporan Terkirim" + RDS dihitung |
| 2 | Foto jalan + tidak ada kerusakan | "Laporan Terkirim" + RDS = 100 |
| 3 | Foto bukan jalan | "Bukan Jalan" + Laporan TIDAK tersimpan |
| 4 | Classifier timeout | Graceful → proceed ke YOLO |
| 5 | Lokasi di luar Kemang | Error: "Laporan ditolak..." |
