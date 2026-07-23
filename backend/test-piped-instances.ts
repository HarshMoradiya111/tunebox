import axios from "axios";

const instances = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.tokhmi.xyz",
    "https://pipedapi.mha.fi",
    "https://pipedapi.smnz.de",
    "https://api.piped.projectsegfau.lt"
];

async function test() {
    for (const api of instances) {
        try {
            console.log(`Testing ${api}...`);
            const res = await axios.get(`${api}/search?q=Espresso+Sabrina+Carpenter+audio&filter=music_songs`, { timeout: 5000 });
            
            const video = res.data.items.find((i: any) => i.type === "stream");
            if (!video) {
                console.log("no video");
                continue;
            }
            console.log(`Found video on ${api}:`, video.url);

            const streamRes = await axios.get(`${api}/streams${video.url}`, { timeout: 5000 });
            const audioStreams = streamRes.data.audioStreams;
            if (audioStreams && audioStreams.length > 0) {
                console.log(`SUCCESS! Stream URL:`, audioStreams[0].url);
                return; // Stop on first success
            }
        } catch (err: any) {
            console.error(`ERROR on ${api}:`, err.message);
        }
    }
}
test();
