const _fetch = require("isomorphic-unfetch");
const { getPreview, getTracks, getDetails } = require("spotify-url-info")(_fetch);

async function test() {
    try {
        const url = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"; // Today's Top Hits
        console.log("Fetching details...");
        const details = await getDetails(url);
        console.log("Title:", details.preview.title);
        console.log("Tracks count:", details.tracks.length);
        console.log("First track:", details.tracks[0].name, "by", details.tracks[0].artists[0].name);
    } catch (e: any) {
        console.error("ERROR:", e.message);
    }
}
test();
