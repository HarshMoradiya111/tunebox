import axios from "axios";

async function test() {
  try {
    const instances = [
      "https://invidious.nerdvpn.de",
      "https://iv.melmac.space",
      "https://invidious.jing.rocks"
    ];

    const instance = instances[0]; // Let's test the first one

    console.log("Searching on Invidious...");
    const searchRes = await axios.get(`${instance}/api/v1/search`, {
      params: { q: "Espresso Sabrina Carpenter audio" }
    });

    const video = searchRes.data.find((v: any) => v.type === "video");
    if (!video) {
      console.log("No videos found");
      return;
    }
    console.log("Found:", video.videoId);

    console.log("Getting stream from Invidious...");
    const videoRes = await axios.get(`${instance}/api/v1/videos/${video.videoId}`);
    
    // Find the highest bitrate audio format
    const audioFormats = videoRes.data.adaptiveFormats.filter((f: any) => f.type.includes("audio/"));
    audioFormats.sort((a: any, b: any) => parseInt(b.bitrate) - parseInt(a.bitrate));

    console.log("Stream URL:", audioFormats[0].url);
  } catch (err: any) {
    console.error("ERROR:", err.response?.data || err.message);
  }
}

test();
