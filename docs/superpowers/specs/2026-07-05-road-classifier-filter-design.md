# Road Classifier Filter — Design Spec

## Overview

Menambahkan validasi "jalan atau bukan" sebelum proses deteksi kerusakan jalan. Jika gambar bukan jalan, sistem tetap memproses deteksi kerusakan namun menampilkan peringatan kepada user.

## Flow

```
Upload Foto
    ↓
POST /api/reports
    ↓
Background Task:
    ├─ 1. Road Classification → hasil: class ("road"/"non-road"), confidence
    ├─ 2. YOLO Damage Detection (selalu dijalankan)
    ├─ 3. Hitung RDS Score
    ├─ 4. Simpan ke DB dengan isRoadValid + warning
    ↓
Frontend polling → tampilkan hasil + warning banner jika non-road
```

## Model Classifier

- **URL:** `https://predict-6a49e64a402cf39ae6eb-dproatj77a-et.a.run.app/predict`
- **API Key:** `ul_4c283c1ebeca35bd5313ddb467f75c8442714bcc`
- **Logic:** Jika `class === "road"` → valid. Jika `class !== "road"` atau confidence < 0.5 → non-road (warning)

## Backend Changes (`server.ts`)

### Background Task (POST /api/reports)

Tambah step Road Classification sebelum YOLO:

```typescript
// Road Classifier
const classifierUrl = "https://predict-6a49e64a402cf39ae6eb-dproatj77a-et.a.run.app/predict";
const classifierApiKey = process.env.ROAD_CLASSIFIER_API_KEY;

let isRoadValid = true;
let roadWarning: string | null = null;

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
        // Parse response - assume format similar to YOLO
        const detectedClass = data.images?.[0]?.results?.[0]?.name;
        const confidence = data.images?.[0]?.results?.[0]?.confidence || 0;

        if (detectedClass !== "road" && confidence < 0.5) {
          isRoadValid = false;
          roadWarning = "Foto tidak terdeteksi sebagai jalanan. Hasil deteksi mungkin tidak akurat.";
        }
      }
    } catch (err) {
      console.error("[Classifier] Error:", err);
    }
  }
}
```

### Database Schema

Tambah kolom di tabel `laporan`:
- `is_road_valid` (boolean, default: true)
- `road_warning` (text, nullable)

### API Response

Tambah field di response `/api/reports` dan tracking:
```typescript
{
  isRoadValid: boolean,
  roadWarning: string | null
}
```

## Frontend Changes (`ReportForm.tsx`)

### State
```typescript
const [isRoadValid, setIsRoadValid] = useState<boolean | null>(null);
const [roadWarning, setRoadWarning] = useState<string | null>(null);
```

### Polling Response (di useEffect)

Ambil `isRoadValid` dan `roadWarning` dari polling response, set ke state.

### SuccessCard

Tambah warning banner jika `isRoadValid === false`:

```tsx
{isRoadValid === false && (
  <motion.div
    className="rounded-2xl p-4 flex items-start gap-3"
    style={{
      background: '#fffbeb',
      border: '1px solid #fde68a'
    }}
  >
    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
    <div>
      <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
        Peringatan: Bukan Jalan
      </p>
      <p className="text-xs mt-1" style={{ color: '#78350f' }}>
        {roadWarning || "Foto tidak terdeteksi sebagai jalanan. Hasil deteksi mungkin tidak akurat."}
      </p>
    </div>
  </motion.div>
)}
```

## Env Variables

Tambah di `.env`:
```
ROAD_CLASSIFIER_API_KEY=ul_4c283c1ebeca35bd5313ddb467f75c8442714bcc
```

## Error Handling

- Jika classifier API gagal/tidak respond → skip classification, anggap valid (graceful degradation)
- Jika `ULTRALYTICS_API_KEY` tidak ada → tetap proses classifier dulu

## Test Cases

1. Upload foto jalan → `isRoadValid = true`, tidak ada warning
2. Upload foto non-road → `isRoadValid = false`, warning tampil
3. Classifier timeout → graceful degradation, tidak block proses
