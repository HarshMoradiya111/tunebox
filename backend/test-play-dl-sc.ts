import play from 'play-dl';

async function testSC() {
  try {
    const searchResults = await play.search("Espresso Sabrina Carpenter", { source: { soundcloud: "tracks" }, limit: 1 });
    if (searchResults && searchResults.length > 0) {
      const track = searchResults[0];
      console.log("Track URL:", track.url);
      
      const streamInfo = await play.stream(track.url);
      console.log("Stream Info:", streamInfo);
    } else {
        console.log("No results");
    }
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
testSC();
