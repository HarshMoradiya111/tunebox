import axios from "axios";

async function test() {
  const instances = [
    "https://pipedapi.smnz.de",
    "https://pipedapi.lunar.icu",
    "https://pipedapi.r4fo.com",
    "https://pipedapi.kavin.rocks"
  ];

  for (const instance of instances) {
    try {
      console.log(`Searching on Piped instance: ${instance}...`);
      const searchRes = await axios.get(`${instance}/search`, {
        params: { q: "Espresso Sabrina Carpenter audio", filter: "music_songs" },
        timeout: 5000
      });

      const items = searchRes.data.items;
      if (!items || items.length === 0) continue;
      
      const video = items.find((v: any) => v.type === "stream") || items[0];
      const videoId = video.url.replace("/watch?v=", "");

      const videoRes = await axios.get(`${instance}/streams/${videoId}`, { timeout: 5000 });
      const audioStreams = videoRes.data.audioStreams;
      
      if (!audioStreams || audioStreams.length === 0) continue;

      audioStreams.sort((a: any, b: any) => b.bitrate - a.bitrate);
      console.log("SUCCESS! Stream URL:", audioStreams[0].url);
      return;
    } catch (err: any) {
      console.error(`Failed on ${instance}:`, err.response?.status || err.message);
    }
  }
  console.log("All instances failed");
}

test();
