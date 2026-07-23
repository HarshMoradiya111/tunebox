const ytSearch = require("yt-search");

async function test() {
  try {
    const searchResults = await ytSearch("Espresso Sabrina Carpenter audio");
    const videoUrl = searchResults.videos[0].url;
    console.log("Video URL:", videoUrl);
    
    // Extract video ID
    const urlObj = new URL(videoUrl);
    const videoId = urlObj.searchParams.get("v");

    const response = await fetch(`https://pipedapi.smnz.de/streams/${videoId}`);
    
    if (!response.ok) {
        console.error("Piped Error:", response.status, await response.text());
        return;
    }

    const data: any = await response.json();
    const audioStreams = data.audioStreams;
    if (audioStreams && audioStreams.length > 0) {
      console.log("Stream URL:", audioStreams[0].url);
    } else {
      console.log("No audio streams found.");
    }
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
