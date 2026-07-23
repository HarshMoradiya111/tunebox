async function testSaavn() {
  try {
    const query = "Espresso Sabrina Carpenter";
    const res = await fetch(`https://saavn.me/search/songs?query=${encodeURIComponent(query)}`);
    const data: any = await res.json();
    
    if (data.success && data.data && data.data.results.length > 0) {
      const song = data.data.results[0];
      console.log("Found Song:", song.name, "by", song.primaryArtists);
      
      const downloadUrls = song.downloadUrl;
      const highestQuality = downloadUrls.find((q: any) => q.quality === "320kbps") || downloadUrls[downloadUrls.length - 1];
      console.log("Stream URL:", highestQuality.url);
    } else {
      console.log("No results found.");
    }
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
testSaavn();
