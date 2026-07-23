async function test() {
  try {
    const res = await fetch("https://tunebox-7lr2.onrender.com/api/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Espresso", artist: "Sabrina Carpenter" })
    });
    const data = await res.json();
    console.log("Stream Endpoint Response:", data);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();
