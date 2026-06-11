#!/usr/bin/env python3
# Builds the social card (OG/Twitter) and favicons from collection previews.
# Run from the project root: python3 scripts/build-assets.py
import os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "images")
ASSETS = os.path.join(ROOT, "assets")
os.makedirs(ASSETS, exist_ok=True)

PERI = (185, 167, 214)      # periwinkle
INK  = (43, 36, 64)
HOT  = (255, 79, 154)
HOT2 = (255, 45, 126)
SUN  = (255, 210, 63)
WHITE= (255, 255, 255)

F_ROUND = "/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf"
F_COMIC = "/System/Library/Fonts/Supplemental/Comic Sans MS Bold.ttf"
def font(path, size):
    try: return ImageFont.truetype(path, size)
    except Exception: return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)

def face(n, size):
    p = os.path.join(IMG, f"{n}.jpg")
    im = Image.open(p).convert("RGB")
    return ImageOps.fit(im, (size, size), Image.LANCZOS)

# ---------- OG / TWITTER CARD 1200x630 ----------
def build_og():
    W, H = 1200, 630
    card = Image.new("RGB", (W, H), PERI)

    # mosaic of faces covering the canvas
    tile = 158
    cols = W // tile + 1
    rows = H // tile + 1
    random.seed(7)
    pool = random.sample(range(1, 2001), cols * rows)
    k = 0
    for r in range(rows):
        for c in range(cols):
            try:
                card.paste(face(pool[k], tile), (c * tile, r * tile))
            except Exception:
                pass
            k += 1

    # darken for contrast
    overlay = Image.new("RGBA", (W, H), (20, 12, 30, 120))
    card = Image.alpha_composite(card.convert("RGBA"), overlay)

    d = ImageDraw.Draw(card)

    # center banner (rotated)
    bw, bh = 1120, 320
    banner = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    bd = ImageDraw.Draw(banner)
    bd.rounded_rectangle([0, 0, bw, bh], radius=26, fill=PERI + (255,), outline=INK + (255,), width=8)

    # title — auto-fit width
    t = "cool i guess crew"
    ts = 132
    while ts > 60:
        title_f = font(F_ROUND, ts)
        tb = bd.textbbox((0, 0), t, font=title_f)
        if tb[2] - tb[0] <= bw - 90:
            break
        ts -= 4
    sub_f = font(F_COMIC, 40)
    tag_f = font(F_COMIC, 30)

    tw = tb[2] - tb[0]
    tx = (bw - tw) // 2
    ty = 40
    for dx, dy, col in [(6, 6, INK), (3, 3, (54,197,224)), (0, 0, HOT)]:
        bd.text((tx + dx, ty + dy), t, font=title_f, fill=col)

    # subtitle
    s = "a collection of 2000"
    sb = bd.textbbox((0, 0), s, font=sub_f); sw = sb[2] - sb[0]
    bd.text(((bw - sw) // 2, 198), s, font=sub_f, fill=INK)

    # tag pill
    tag = "  who's cooler?  YOU decide.  "
    pb = bd.textbbox((0, 0), tag, font=tag_f); pw = pb[2] - pb[0]; ph = pb[3] - pb[1]
    px = (bw - pw) // 2; py = 252
    bd.rounded_rectangle([px - 6, py - 8, px + pw + 6, py + ph + 16], radius=20,
                         fill=SUN + (255,), outline=INK + (255,), width=4)
    bd.text((px, py), tag, font=tag_f, fill=INK)

    banner = banner.rotate(-2.5, expand=True, resample=Image.BICUBIC)
    card.alpha_composite(banner, ((W - banner.width) // 2, (H - banner.height) // 2))

    card.convert("RGB").save(os.path.join(ASSETS, "og.png"), "PNG")
    print("og.png ->", os.path.join(ASSETS, "og.png"))

# ---------- FAVICON (star) + APPLE TOUCH (face) ----------
def star_icon(size):
    import math
    s = size * 4
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = int(s * 0.06)
    d.rounded_rectangle([pad, pad, s - pad, s - pad], radius=int(s * 0.22),
                        fill=PERI + (255,), outline=INK + (255,), width=max(2, s // 32))
    # 5-point star
    cx = cy = s / 2
    R = s * 0.30; r = R * 0.42
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = R if i % 2 == 0 else r
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(pts, fill=HOT, outline=INK)
    return im.resize((size, size), Image.LANCZOS)

def rounded_face(n, size):
    f = face(n, size).convert("RGBA")
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=int(size * 0.22), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(f, (0, 0), mask)
    return out

def build_icons():
    # apple touch icon — a face (Legally-Blonde #1), looks great at 180
    rounded_face(1, 180).convert("RGB").save(os.path.join(ASSETS, "apple-touch-icon.png"), "PNG")
    # png favicons (star, crisp small)
    star_icon(32).save(os.path.join(ASSETS, "favicon-32.png"), "PNG")
    star_icon(16).save(os.path.join(ASSETS, "favicon-16.png"), "PNG")
    star_icon(180).convert("RGB")  # warm cache
    # multi-size .ico
    star_icon(48).save(os.path.join(ASSETS, "favicon.ico"),
                       sizes=[(16, 16), (32, 32), (48, 48)])
    # 512 maskable for manifest
    star_icon(512).save(os.path.join(ASSETS, "icon-512.png"), "PNG")
    print("favicons + apple-touch-icon + icon-512 written")

if __name__ == "__main__":
    build_og()
    build_icons()
