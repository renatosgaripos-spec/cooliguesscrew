// GET /api/scores?top=300
// Returns the voted works ranked by count. Items with 0 votes are simply
// absent — the front-end merges them in as 0. If D1 isn't bound yet,
// returns configured:false so the site falls back to localStorage.

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ scores: [], configured: false });

  const url = new URL(request.url);
  let top = parseInt(url.searchParams.get("top") || "300", 10);
  if (!Number.isInteger(top) || top < 1) top = 300;
  if (top > 2000) top = 2000;

  try {
    const { results } = await env.DB.prepare(
      "SELECT id, count FROM tally ORDER BY count DESC, CAST(id AS INTEGER) ASC LIMIT ?"
    ).bind(top).all();
    return json({ scores: results || [], configured: true });
  } catch (e) {
    return json({ scores: [], configured: false, error: String(e) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
