import play from 'play-dl';

async function test() {
  try {
    console.log("Searching...");
    const searchResults = await play.search("Espresso Sabrina Carpenter audio", { limit: 1 });
    
    if (!searchResults.length) {
      console.log("No results");
      return;
    }
    
    console.log("Found:", searchResults[0].id);
    
    console.log("Getting stream...");
    const stream = await play.stream(searchResults[0].url);
    console.log("Stream URL:", (stream as any).url);
  } catch (err: any) {
    console.error("ERROR:", err.message || err);
  }
}

test();
