import axios from "axios";

async function test() {
    try {
        console.log("Searching saavn.me...");
        const res = await axios.get("https://saavn.me/search/songs?query=Espresso+Sabrina+Carpenter");
        
        const songs = res.data.data.results;
        if (!songs || songs.length === 0) return console.log("no songs");
        console.log("Found:", songs[0].name);
        
        const streamUrls = songs[0].downloadUrl;
        if (streamUrls && streamUrls.length > 0) {
            console.log("Stream URL (highest):", streamUrls[streamUrls.length - 1].link);
        } else {
            console.log("No stream URLs");
        }
    } catch (err: any) {
        console.error("ERROR:", err.message);
    }
}
test();
