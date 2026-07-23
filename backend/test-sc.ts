import play from "play-dl";

async function test() {
  try {
    console.log("Searching on SoundCloud...");
    const searchResults = await play.search("Espresso Sabrina Carpenter", { source: { soundcloud: "tracks" }, limit: 1 });
    
    if (!searchResults || searchResults.length === 0) {
      console.log("No results");
      return;
    }
    
    console.log("Found:", searchResults[0].url);

    console.log("Getting stream...");
    const stream = await play.stream(searchResults[0].url);
    console.log("Stream URL:", (stream as any).url);
  } catch (err: any) {
    console.error("ERROR:", err.message || err);
  }
}

test();
