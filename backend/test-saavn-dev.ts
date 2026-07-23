import axios from "axios";

async function test() {
    try {
        console.log("Searching saavn.dev...");
        const res = await axios.get("https://saavn.dev/api/search/songs?query=Espresso+Sabrina+Carpenter");
        
        console.log("Data:", Object.keys(res.data));
        const songs = res.data.data.results;
        if (!songs || songs.length === 0) return console.log("no songs");
        console.log("Found:", songs[0].name);
        console.log("Keys of song:", Object.keys(songs[0]));
        
        const streamUrls = songs[0].downloadUrl;
        if (streamUrls && streamUrls.length > 0) {
            console.log("Stream URL (highest):", streamUrls[streamUrls.length - 1].url);
        } else {
            console.log("No stream URLs");
        }
    } catch (err: any) {
        console.error("ERROR:", err.message);
    }
}
test();
