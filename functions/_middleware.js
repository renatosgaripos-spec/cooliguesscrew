// For shared matchup links (/?vs=A,B) inject a per-matchup social card so the
// tweet/preview shows those two exact tokens. Static HTML otherwise untouched.

const MAX = 2000;
const valid = (n) => { const x = parseInt(n, 10); return Number.isInteger(x) && x >= 1 && x <= MAX; };

class SetContent {
  constructor(v) { this.v = v; }
  element(el) { el.setAttribute("content", this.v); }
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const vs = url.searchParams.get("vs");

  const res = await next();
  if (!vs) return res;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;

  let [a, b] = vs.split(",").map((s) => (s || "").trim());
  if (!valid(a) || !valid(b)) return res;

  const og = `${url.origin}/api/og?vs=${a},${b}`;
  const title = `CIGC #${a} vs #${b} — left or right? 👀`;

  return new HTMLRewriter()
    .on('meta[property="og:image"]', new SetContent(og))
    .on('meta[name="twitter:image"]', new SetContent(og))
    .on('meta[property="og:title"]', new SetContent(title))
    .on('meta[name="twitter:title"]', new SetContent(title))
    .on('meta[property="og:url"]', new SetContent(`${url.origin}/?vs=${a},${b}`))
    .transform(res);
}
