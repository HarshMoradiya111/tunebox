const ytStream = require("yt-stream");
const ytSearch = require("yt-search");

async function test() {
  try {
    const searchResults = await ytSearch("Espresso Sabrina Carpenter audio");
    const videoUrl = searchResults.videos[0].url;
    console.log("Video URL:", videoUrl);
    
    const stream = await ytStream.stream(videoUrl, {
      quality: "high",
      type: "audio",
      highWaterMark: 1048576 * 32
    });
    console.log("Stream URL:", stream.url);
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
