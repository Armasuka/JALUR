const run = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/reports/4/detect', {
      method: 'POST',
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error(err);
  }
};
run();
