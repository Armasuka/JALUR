async function testDetect() {
  try {
    console.log("Triggering detect...");
    const res = await fetch("http://localhost:3000/api/reports/9/detect", {
      method: "POST"
    });
    if (!res.ok) {
      console.log("Error:", res.status, await res.text());
    } else {
      console.log("Success:", await res.json());
    }
  } catch (err) {
    console.error("Fetch failed", err);
  }
}
testDetect();
