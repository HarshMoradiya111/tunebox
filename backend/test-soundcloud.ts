const SoundCloud = require("soundcloud-scraper");
const client = new SoundCloud.Client();

async function test() {
  try {
    const searchResults = await client.search("Espresso Sabrina Carpenter", "track");
    if (searchResults && searchResults.length > 0) {
      const trackUrl = searchResults[0].url;
      console.log("Track URL:", trackUrl);
      
      const track = await client.getSongInfo(trackUrl);
      console.log("Stream URL:", track.streamURL);
      
      // The streamURL requires a client_id. We can fetch it using the scraper if not appended.
      // Wait, soundcloud scraper gives a stream URL that works? Let's check.
    } else {
        console.log("No track found");
    }
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
