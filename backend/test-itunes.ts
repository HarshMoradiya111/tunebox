import axios from "axios";

async function test() {
  try {
    const res = await axios.get("https://itunes.apple.com/search?term=Espresso+Sabrina+Carpenter&entity=song&limit=1");
    if (res.data.resultCount === 0) return console.log("No songs");
    
    const song = res.data.results[0];
    console.log("Song Found:", song.trackName, "by", song.artistName);
    console.log("Preview URL:", song.previewUrl);
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}

test();
