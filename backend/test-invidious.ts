const ytSearch = require("yt-search");

async function test() {
  try {
    const searchResults = await ytSearch("Espresso Sabrina Carpenter audio");
    const videoUrl = searchResults.videos[0].url;
    console.log("Video URL:", videoUrl);
    
    const urlObj = new URL(videoUrl);
    const videoId = urlObj.searchParams.get("v");

    const instances = [
      "vid.puffyan.us",
      "invidious.jing.rocks",
      "invidious.nerdvpn.de"
    ];

    for (const instance of instances) {
      try {
        console.log("Trying", instance);
        const response = await fetch(`https://${instance}/api/v1/videos/${videoId}`);
        if (!response.ok) continue;
        const data: any = await response.json();
        
        const formatStreams = data.formatStreams || [];
        const audioStreams = formatStreams.filter((f: any) => f.type && f.type.startsWith("audio"));
        if (audioStreams.length > 0) {
           console.log("Stream URL:", audioStreams[0].url);
           return; // Success!
        }
      } catch (e) {
        console.log(instance, "failed");
      }
    }
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
