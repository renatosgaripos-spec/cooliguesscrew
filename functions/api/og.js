// GET /api/og?vs=A,B
// Renders a 1200x630 social-card PNG: the two tokens side by side with VS,
// so a shared matchup link unfurls into a card showing those exact tokens.
import { ImageResponse } from "workers-og";

const MAX = 2000;
const valid = (n) => { const x = parseInt(n, 10); return Number.isInteger(x) && x >= 1 && x <= MAX; };

let fontCache = null;
async function getFont(origin) {
  if (fontCache) return fontCache;
  const r = await fetch(`${origin}/assets/luckiestguy.ttf`);
  if (!r.ok) throw new Error("font fetch failed");
  fontCache = await r.arrayBuffer();
  return fontCache;
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  let [a, b] = (url.searchParams.get("vs") || "").split(",").map((s) => (s || "").trim());
  if (!valid(a) || !valid(b)) { a = "1"; b = "2"; }

  const origin = url.origin;
  const L = `${origin}/images/${a}.jpg`;
  const R = `${origin}/images/${b}.jpg`;

  const html = `
  <div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#b9a7d6;align-items:center;justify-content:center;font-family:'Luckiest Guy';">
    <div style="display:flex;color:#ff2d7e;font-size:60px;margin-bottom:14px;">LEFT OR RIGHT?</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:26px;">
      <img src="${L}" width="400" height="400" style="border:10px solid #2b2440;object-fit:cover;" />
      <div style="display:flex;align-items:center;justify-content:center;width:108px;height:108px;border-radius:54px;background:#ff2d7e;color:#ffffff;border:8px solid #2b2440;font-size:44px;">VS</div>
      <img src="${R}" width="400" height="400" style="border:10px solid #2b2440;object-fit:cover;" />
    </div>
    <div style="display:flex;color:#2b2440;font-size:30px;margin-top:18px;">cool i guess crew · #${a} vs #${b}</div>
  </div>`;

  let font;
  try { font = await getFont(origin); } catch (e) { /* fall through */ }

  const img = new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: font ? [{ name: "Luckiest Guy", data: font, weight: 400, style: "normal" }] : undefined,
  });

  return new Response(img.body, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
