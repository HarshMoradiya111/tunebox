const ytSearch = require("yt-search");

async function test() {
  try {
    const searchResults = await ytSearch("Espresso Sabrina Carpenter audio");
    const videoUrl = searchResults.videos[0].url;
    console.log("Video URL:", videoUrl);

    const response = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: videoUrl,
        isAudioOnly: true,
        aFormat: "mp3"
      })
    });
    
    if (!response.ok) {
        console.error("Cobalt Error:", response.status, await response.text());
        return;
    }

    const data = await response.json();
    console.log("Cobalt Response:", data);
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
