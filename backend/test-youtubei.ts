import { Innertube } from "youtubei.js";

async function test() {
  try {
    console.log("Initializing Innertube...");
    const yt = await Innertube.create();
    
    console.log("Searching...");
    const search = await yt.search("Espresso Sabrina Carpenter audio");
    
    const video = search.videos[0];
    if (!video) {
        console.log("No video found");
        return;
    }
    console.log("Found:", (video as any).title.text);

    console.log("Getting info...");
    const info = await yt.getBasicInfo((video as any).id);
    
    const bestAudio = info.chooseFormat({ type: "audio", quality: "best" });
    
    console.log("Stream URL:", bestAudio.url || await bestAudio.decipher(yt.session.player));
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}

test();
