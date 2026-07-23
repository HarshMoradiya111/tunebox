import axios from "axios";

async function test() {
  try {
    const res = await axios.get("https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=Espresso+Sabrina+Carpenter&_format=json&_marker=0&ctx=web6dot0");
    const songs = res.data.songs.data;
    if (!songs || songs.length === 0) return console.log("No songs");
    
    console.log("Song Found:", songs[0].title);
    
    // To get the stream URL, we need the song details using its ID
    const detailsRes = await axios.get(`https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${songs[0].id}&_format=json&_marker=0&ctx=web6dot0`);
    
    const songData = detailsRes.data[songs[0].id];
    console.log("Song Data Keys:", Object.keys(songData));
    console.log("more_info keys:", Object.keys(songData.more_info || {}));
    if (songData.more_info?.vlink) console.log("vlink:", songData.more_info.vlink);
  } catch (err: any) {
    console.error("ERROR:", err.message);
  }
}

test();
