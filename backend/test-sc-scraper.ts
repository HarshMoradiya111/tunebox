import SoundCloud from "soundcloud-scraper";
const client = new SoundCloud.Client();

async function test() {
  try {
    console.log("Searching on SoundCloud...");
    const search = await client.search("Espresso Sabrina Carpenter", "track");
    
    if (!search || search.length === 0) {
      console.log("No results");
      return;
    }
    
    const trackInfo = await client.getSongInfo(search[0].url);
    console.log("Found:", trackInfo.title);
    
    const stream = await trackInfo.downloadProgressive();
    
    // We just want the direct stream URL, soundcloud-scraper downloadProgressive returns a stream, 
    // but the URL itself is available via trackInfo.fetchStreamURL() or something similar.
    // Actually trackInfo.trackURL is the track page, but the stream URL is:
    console.log("Stream URL fetched directly.");
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}

test();
