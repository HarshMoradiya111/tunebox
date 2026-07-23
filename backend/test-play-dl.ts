const play = require("play-dl");
const ytSearch = require("yt-search");

async function test() {
  try {
    const searchResults = await ytSearch("Espresso Sabrina Carpenter audio");
    const videoUrl = searchResults.videos[0].url;
    console.log("Video URL:", videoUrl);
    
    const streamInfo = await play.stream(videoUrl);
    console.log("Stream URL:", streamInfo.url);
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
