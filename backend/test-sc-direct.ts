async function testSC() {
  try {
    // 1. Fetch Soundcloud homepage to get a script URL
    const scHtml = await (await fetch("https://soundcloud.com")).text();
    const scriptRegex = /<script crossorigin src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+)">/g;
    let match;
    let clientId = null;
    while ((match = scriptRegex.exec(scHtml)) !== null) {
      const scriptUrl = match[1];
      const scriptText = await (await fetch(scriptUrl)).text();
      const idMatch = scriptText.match(/client_id:"([a-zA-Z0-9]+)"/);
      if (idMatch) {
        clientId = idMatch[1];
        break;
      }
    }
    
    if (!clientId) {
      console.log("Could not find client_id");
      return;
    }
    console.log("Client ID:", clientId);
    
    // 2. Search track
    const query = encodeURIComponent("Espresso Sabrina Carpenter");
    const searchRes = await fetch(`https://api-v2.soundcloud.com/search/tracks?q=${query}&client_id=${clientId}&limit=1`);
    const searchData: any = await searchRes.json();
    
    if (searchData.collection && searchData.collection.length > 0) {
      const track = searchData.collection[0];
      console.log("Found Track:", track.title);
      
      // 3. Get stream
      const transcodings = track.media.transcodings;
      const progressive = transcodings.find((t: any) => t.format.protocol === 'progressive') || transcodings[0];
      
      const streamUrlRes = await fetch(`${progressive.url}?client_id=${clientId}`);
      const streamUrlData: any = await streamUrlRes.json();
      
      console.log("Stream URL:", streamUrlData.url);
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
testSC();
