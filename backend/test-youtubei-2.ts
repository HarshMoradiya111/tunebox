import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  
  const searchResults = await yt.search('Espresso Sabrina Carpenter audio');
  const video = searchResults.videos[0] as any;
  console.log("Found:", video.title?.text, "ID:", video.id);

  try {
    const info = await yt.getBasicInfo(video.id);
    const formats = info.streaming_data?.formats;
    const adaptive = info.streaming_data?.adaptive_formats;
    
    let audioFormat = adaptive?.find(f => f.has_audio && !f.has_video);
    if (!audioFormat) {
      audioFormat = formats?.find(f => f.has_audio);
    }
    
    if (audioFormat) {
      console.log("Stream URL:", audioFormat.url || (audioFormat as any).signature_cipher);
      console.log("Deciphered URL:", audioFormat.decipher(yt.session.player));
    }
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
