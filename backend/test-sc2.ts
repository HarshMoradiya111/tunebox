import SoundCloud from "soundcloud-scraper";
const client = new SoundCloud.Client();

async function test() {
  try {
    const search = await client.search("Espresso Sabrina Carpenter", "track");
    if (!search || search.length === 0) return;
    
    const trackInfo = await client.getSongInfo(search[0].url);
    console.log("Track:", trackInfo.title);
    
    // Is there a direct stream URL property?
    console.log("Stream URL (if exists):", trackInfo.streamURL);
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}

test();
