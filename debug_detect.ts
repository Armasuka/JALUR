import * as dotenv from 'dotenv';
dotenv.config();

import { db } from "./src/db/index";
import { laporan, deteksi } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function debugDetect(id: number) {
  try {
    const [report] = await db.select().from(laporan).where(eq(laporan.id_laporan, id));
    if (!report) {
      console.log("Not found");
      return;
    }
    console.log("Report found:", report.kode_unik, "Length of gambar:", report.gambar.length);

    let images: string[] = [];
    try {
      images = JSON.parse(report.gambar);
      if (!Array.isArray(images)) images = [report.gambar];
    } catch (e) {
      images = [report.gambar];
    }
    
    console.log("Images to process:", images.length);
    const yoloUrl = "https://predict-69fefbdb869dd01551bd-dproatj77a-et.a.run.app/predict";
    const apiKey = process.env.ULTRALYTICS_API_KEY;

    for (let i = 0; i < images.length; i++) {
      console.log("Processing image", i, "length:", images[i].length);
      const imgData = images[i];
      if (!imgData || !imgData.includes(",")) continue;

      const base64Data = imgData.split(",")[1];
      const mimeType = imgData.split(";")[0].split(":")[1] || "image/jpeg";
      console.log("mimeType:", mimeType);
      
      const buffer = Buffer.from(base64Data, 'base64');
      console.log("buffer length:", buffer.length);
      
      const blob = new Blob([buffer], { type: mimeType });
      console.log("blob size:", blob.size);

      const formData = new FormData();
      formData.append("file", blob, `image_${i}.jpg`);
      formData.append("conf", "0.25");
      formData.append("iou", "0.7");
      formData.append("imgsz", "640");

      console.log("Fetching YOLO...");
      const yoloResponse = await fetch(yoloUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
        body: formData,
      });

      console.log("YOLO Response status:", yoloResponse.status);
      if (!yoloResponse.ok) {
        console.error("YOLO failed:", await yoloResponse.text());
      } else {
        const data = await yoloResponse.json();
        console.log("YOLO Success data:", JSON.stringify(data).substring(0, 100));
      }
    }
    console.log("Done");
  } catch (err) {
    console.error("CRASH:", err);
  }
  process.exit(0);
}

debugDetect(9);
