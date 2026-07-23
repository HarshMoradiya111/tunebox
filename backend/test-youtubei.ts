import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  
  const searchResults = await yt.search('Espresso Sabrina Carpenter audio');
  const video = searchResults.videos[0] as any;
  console.log("Found:", video.title?.text, "ID:", video.id);

  try {
    const info = await yt.getBasicInfo(video.id);
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    console.log("Stream URL:", format.decipher(yt.session.player));
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
