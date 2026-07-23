const youtubedl = require('youtube-dl-exec');
const ytSearch = require("yt-search");

async function test() {
  try {
    const searchResults = await ytSearch("Espresso Sabrina Carpenter audio");
    const videoUrl = searchResults.videos[0].url;
    console.log("Video URL:", videoUrl);
    
    // Get the direct audio stream URL
    const output = await youtubedl(videoUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });

    const formats = output.formats;
    const audioFormats = formats.filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none');
    
    if (audioFormats.length > 0) {
      // Sort by best quality (highest average bitrate or best acodec)
      audioFormats.sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));
      console.log("Stream URL:", audioFormats[0].url);
    } else {
      console.log("No audio formats found.");
    }

  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
