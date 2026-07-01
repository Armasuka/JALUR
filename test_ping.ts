async function testPing() {
  try {
    const res = await fetch("http://localhost:3000/api/reports");
    console.log("Status:", res.status);
  } catch (err) {
    console.error("Ping failed:", err);
  }
}
testPing();
