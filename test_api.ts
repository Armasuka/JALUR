async function testApi() {
  try {
    const res = await fetch("http://localhost:3000/api/reports");
    if (!res.ok) {
      console.log("Error:", res.status, await res.text());
    } else {
      const data = await res.json();
      console.log("Success. Total reports:", data.length);
      if (data.length > 0) {
        console.log("Latest:", data[0].id, data[0].kodeUnik);
      }
    }
  } catch (err) {
    console.error("Fetch failed", err);
  }
}
testApi();
