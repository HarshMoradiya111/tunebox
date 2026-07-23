// @ts-ignore
import ytSearch from "yt-search";
import axios from "axios";

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

    console.log("Getting stream from Cobalt...");
    const response = await axios.post("https://api.cobalt.tools/api/json", {
      url: video.url,
      isAudioOnly: true
    }, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    
    console.log("Cobalt Response:", response.data);
  } catch (err: any) {
    console.error("ERROR:", err.response?.data || err.message);
  }
}

test();
