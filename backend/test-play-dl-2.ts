const play = require("play-dl");

async function test() {
  try {
    const searchResults = await play.search("Espresso Sabrina Carpenter audio", { limit: 1 });
    if (searchResults && searchResults.length > 0) {
      const video = searchResults[0];
      console.log("Video URL:", video.url);
      
      const streamInfo = await play.stream(video.url);
      console.log("Stream URL:", streamInfo.url);
    }
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
