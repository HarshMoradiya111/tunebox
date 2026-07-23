import play from 'play-dl';

async function test() {
    try {
        console.log("Searching...");
        const search = await play.search("Espresso Sabrina Carpenter audio", { limit: 1 });
        if (!search || search.length === 0) {
            return console.log("No videos found.");
        }
        
        console.log("Found:", search[0].url);
        
        console.log("Extracting stream...");
        const stream = await play.stream(search[0].url);
        console.log("Stream URL:", (stream as any).url);
        console.log("Stream Type:", stream.type);
        
    } catch (err: any) {
        console.error("ERROR:", err.message);
    }
}

test();
