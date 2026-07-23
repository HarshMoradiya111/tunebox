import { Client } from "soundcloud-scraper";

async function test() {
    const client = new Client();
    try {
        console.log("Searching SoundCloud...");
        const search = await client.search("Espresso Sabrina Carpenter", "track");
        if (search.length === 0) {
            return console.log("No tracks found");
        }
        console.log("Found:", search[0].url);

        const song = await client.getSongInfo(search[0].url);
        console.log("Stream URL:", song.streamURL);
        
        // Sometimes streamURL requires client_id
        console.log("Stream with Client ID:", `${song.streamURL}?client_id=`);
    } catch (err: any) {
        console.error("ERROR:", err.message);
    }
}
test();
