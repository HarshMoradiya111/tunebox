import ytdl from "@distube/ytdl-core";
// @ts-ignore
import ytSearch from "yt-search";

async function test() {
  try {
    console.log("Searching...");
    const r = await ytSearch("Espresso Sabrina Carpenter audio");
    const video = r.videos[0];
    if (!video) {
      console.log("No videos found");
      return;
    }
    console.log("Found:", video.url);

    console.log("Getting info...");
    const info = await ytdl.getInfo(video.url);
    const format = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
    
    console.log("Stream URL:", format.url);
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}

test();
