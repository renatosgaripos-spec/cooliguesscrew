// POST /api/vote   body: { winner: <1..2000>, loser: <1..2000> }
// Atomically increments the winner's tally. Light anti-spam:
//   - must send our X-CIGC-Vote header (blocks trivial scripts)
//   - same-site Origin check (blocks cross-site spam)
//   - per-IP rate limit: minute + day buckets in D1
// Not bulletproof — just enough friction for a small art site.

const MAX_ID  = 2000;
const PER_MIN = 25;    // votes / IP / minute
const PER_DAY = 800;   // votes / IP / day

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "voting not configured" }, 503);

  if (request.headers.get("x-cigc-vote") !== "1")
    return json({ error: "bad request" }, 400);

  const host = new URL(request.url).hostname;
  const origin = request.headers.get("origin") || "";
  if (origin && !okOrigin(origin, host))
    return json({ error: "forbidden" }, 403);

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }

  const winner = toId(body.winner);
  const loser  = toId(body.loser);
  if (!winner || !loser || winner === loser)
    return json({ error: "invalid pair" }, 400);

  const ip  = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const now = Math.floor(Date.now() / 1000);

  // rate limit
  const perMin = await bump(env.DB, `${ip}:m${Math.floor(now / 60)}`,    now + 60);
  if (perMin > PER_MIN) return json({ error: "slow down" }, 429);
  const perDay = await bump(env.DB, `${ip}:d${Math.floor(now / 86400)}`, now + 86400);
  if (perDay > PER_DAY) return json({ error: "daily limit reached" }, 429);

  // occasional cleanup of expired rate rows
  if (Math.random() < 0.05)
    await env.DB.prepare("DELETE FROM rate WHERE exp < ?").bind(now).run();

  // atomic increment
  await env.DB.prepare(
    "INSERT INTO tally (id, count) VALUES (?, 1) ON CONFLICT(id) DO UPDATE SET count = count + 1"
  ).bind(String(winner)).run();

  const row = await env.DB.prepare("SELECT count FROM tally WHERE id = ?")
    .bind(String(winner)).first();

  return json({ ok: true, id: String(winner), count: row ? row.count : 1 });
}

async function bump(db, key, exp) {
  await db.prepare(
    "INSERT INTO rate (k, n, exp) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = n + 1"
  ).bind(key, exp).run();
  const r = await db.prepare("SELECT n FROM rate WHERE k = ?").bind(key).first();
  return r ? r.n : 1;
}

function toId(v) {
  const n = parseInt(v, 10);
  return Number.isInteger(n) && n >= 1 && n <= MAX_ID ? n : 0;
}

function okOrigin(origin, host) {
  try {
    const h = new URL(origin).hostname;
    return h === host
      || h.endsWith("cooliguesscrew.com")
      || h.endsWith("pages.dev")
      || h === "localhost" || h === "127.0.0.1";
  } catch { return false; }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
