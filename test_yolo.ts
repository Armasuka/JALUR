import fs from "fs";

async function testYolo() {
  const yoloUrl = "https://predict-69fefbdb869dd01551bd-dproatj77a-et.a.run.app/predict";
  const apiKey = "ul_372f43066d1088098a451681e1e12c5898324e17";

  // Create a dummy image (e.g., 800x400 red rectangle) to see if coordinates are returned in 800x400 or 640x640.
  // Actually, I can't easily create an image without canvas, I'll just use a small base64 pixel or download an image.
  // Better yet, I'll fetch a placeholder image.
  const imgRes = await fetch("https://via.placeholder.com/800x400.jpg");
  const blob = await imgRes.blob();

  const formData = new FormData();
  formData.append("file", blob, "image.jpg");
  formData.append("conf", "0.01"); // low conf to get any box
  formData.append("iou", "0.7");
  formData.append("imgsz", "640");

  const yoloResponse = await fetch(yoloUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    body: formData,
  });

  console.log("Status:", yoloResponse.status);
  const data = await yoloResponse.json();
  console.log(JSON.stringify(data, null, 2));
}
testYolo();
