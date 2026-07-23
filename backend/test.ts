import ytStream from "yt-stream";

async function test() {
  try {
    console.log("Searching...");
    const searchResults = await ytStream.search("Espresso Sabrina Carpenter audio");
    console.log("Found:", searchResults[0]?.id);
    
    console.log("Getting info...");
    const streamInfo = await ytStream.getInfo(searchResults[0].id);
    console.log("Got info! Formats:", streamInfo.formats.length);
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}

test();
