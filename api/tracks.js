// Same-origin proxy for the iTunes Search API.
//
// The frontend used to call itunes.apple.com directly, which is unreliable
// from the browser: Apple's CDN caches search results per-URL (not per
// Origin), so a client can be served a cached response that was originally
// fetched without CORS headers, and the browser silently blocks it. A
// server-to-server fetch has no CORS involved at all, so it always works.
module.exports = async function handler(req, res) {
  const params = new URLSearchParams(req.query).toString();
  try {
    const apiRes = await fetch(`https://itunes.apple.com/search?${params}`);
    const data = await apiRes.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "iTunes API request failed" });
  }
};
