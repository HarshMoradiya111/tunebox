import axios from "axios";

async function test() {
    try {
        console.log("Searching piped...");
        const res = await axios.get("https://pipedapi.kavin.rocks/search?q=Espresso+Sabrina+Carpenter+audio&filter=music_songs");
        
        const video = res.data.items.find((i: any) => i.type === "stream");
        if (!video) return console.log("no video");
        console.log("Found video:", video.url);

        const streamRes = await axios.get(`https://pipedapi.kavin.rocks/streams${video.url}`);
        const audioStreams = streamRes.data.audioStreams;
        if (audioStreams && audioStreams.length > 0) {
            console.log("Stream URL:", audioStreams[0].url);
        } else {
            console.log("No audio streams");
        }
    } catch (err: any) {
        console.error("ERROR:", err.message);
    }
}
test();
