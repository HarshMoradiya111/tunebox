import axios from "axios";

async function test() {
  try {
    console.log("Searching on Saavn...");
    // Let's use the extremely popular unofficial Saavn API
    // (There are many instances, saavn.dev is currently one of the most stable)
    const searchRes = await axios.get(`https://saavn.dev/api/search/songs`, {
      params: { query: "Espresso Sabrina Carpenter" }
    });

    const results = searchRes.data?.data?.results;
    if (!results || results.length === 0) {
      console.log("No songs found");
      return;
    }

    const song = results[0];
    console.log("Found:", song.name, "-", song.primaryArtists);

    // Saavn API provides direct download links in the response
    const downloadUrls = song.downloadUrl;
    if (!downloadUrls || downloadUrls.length === 0) {
      console.log("No download URL found");
      return;
    }

    // Sort by quality (usually they have 12kbps, 48kbps, 96kbps, 160kbps, 320kbps)
    const bestQuality = downloadUrls.sort((a: any, b: any) => {
        return parseInt(b.quality) - parseInt(a.quality);
    })[0];

    console.log("Stream URL:", bestQuality.url);
  } catch (err: any) {
    console.error("ERROR:", err.response?.status, err.message);
  }
}

test();
