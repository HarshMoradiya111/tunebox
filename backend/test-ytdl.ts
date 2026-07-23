const ytSearch = require("yt-search");
const ytdl = require("@distube/ytdl-core");

async function test() {
    try {
        console.log("Searching...");
        const searchResults = await ytSearch("Espresso Sabrina Carpenter audio");
        if (searchResults && searchResults.videos.length > 0) {
            const videoUrl = searchResults.videos[0].url;
            console.log("Found video:", videoUrl);
            
            const streamInfo = await ytdl.getInfo(videoUrl);
            const audioStream = ytdl.chooseFormat(streamInfo.formats, { quality: "highestaudio" });
            
            console.log("Stream URL:", audioStream.url);
        }
    } catch (err: any) {
        console.error("YTDL Error:", err.message);
    }
}
test();
