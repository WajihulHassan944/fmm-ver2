from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw
import math, random

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'public/images/hero-fight-original.png'
OUT = ROOT / 'public/images/fmm-experience/backgrounds'
OUT.mkdir(parents=True, exist_ok=True)

source = Image.open(SRC).convert('RGB')


def cover(im, size, focus=(0.5, 0.5)):
    tw, th = size
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    fx, fy = focus
    left = int((nw - tw) * fx)
    top = int((nh - th) * fy)
    left = max(0, min(left, nw - tw))
    top = max(0, min(top, nh - th))
    return resized.crop((left, top, left + tw, top + th))


def radial_vignette(size, strength=0.72):
    w, h = size
    mask = Image.new('L', size, 0)
    px = mask.load()
    cx, cy = w / 2, h / 2
    maxd = math.sqrt(cx * cx + cy * cy)
    for y in range(h):
        for x in range(w):
            d = math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxd
            v = int(255 * min(1, max(0, (d - 0.18) / 0.82)) * strength)
            px[x, y] = v
    return mask.filter(ImageFilter.GaussianBlur(max(18, min(size) // 25)))


def overlay_gradient(im, left=(4, 7, 12, 235), right=(4, 7, 12, 70), top_alpha=30, bottom_alpha=220):
    w, h = im.size
    overlay = Image.new('RGBA', im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for x in range(w):
        t = x / max(1, w - 1)
        rgba = tuple(int(left[i] * (1 - t) + right[i] * t) for i in range(4))
        draw.line((x, 0, x, h), fill=rgba)
    vertical = Image.new('RGBA', im.size, (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vertical)
    for y in range(h):
        t = y / max(1, h - 1)
        alpha = int(top_alpha * (1 - t) + bottom_alpha * t)
        vdraw.line((0, y, w, y), fill=(2, 4, 8, alpha))
    return Image.alpha_composite(Image.alpha_composite(im.convert('RGBA'), overlay), vertical)


def arena_lines(size, red=True, blue=True, opacity=34):
    w, h = size
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    step = max(54, w // 28)
    for x in range(-h, w + h, step):
        draw.line((x, 0, x + h, h), fill=(255, 255, 255, opacity // 3), width=1)
    if red:
        draw.rectangle((0, 0, max(3, w // 900), h), fill=(224, 17, 27, opacity * 2))
        draw.polygon([(0, 0), (w * .32, 0), (w * .12, h), (0, h)], fill=(210, 12, 24, opacity))
    if blue:
        draw.polygon([(w, 0), (w * .70, 0), (w * .90, h), (w, h)], fill=(16, 126, 212, opacity))
    return layer


def add_noise(im, amount=7, seed=17):
    random.seed(seed)
    rgba = im.convert('RGBA')
    w, h = rgba.size
    noise = Image.new('RGBA', rgba.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(noise)
    count = int(w * h * 0.0016)
    for _ in range(count):
        x = random.randrange(w)
        y = random.randrange(h)
        a = random.randrange(6, amount + 12)
        draw.point((x, y), fill=(255, 255, 255, a))
    return Image.alpha_composite(rgba, noise)


def save_variant(name, size, focus, grade, blur=0, contrast=1.08, saturation=0.9, brightness=0.82, left_alpha=235, right_alpha=80, red=True, blue=True, seed=17):
    im = cover(source, size, focus)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    im = ImageEnhance.Contrast(im).enhance(contrast)
    im = ImageEnhance.Color(im).enhance(saturation)
    im = ImageEnhance.Brightness(im).enhance(brightness)
    tint = Image.new('RGB', size, grade)
    im = Image.blend(im, tint, 0.09)
    im = overlay_gradient(im, left=(3, 6, 11, left_alpha), right=(3, 6, 11, right_alpha))
    im = Image.alpha_composite(im.convert('RGBA'), arena_lines(size, red=red, blue=blue))
    vignette = radial_vignette(size, 0.8)
    dark = Image.new('RGBA', size, (0, 0, 0, 205))
    im = Image.composite(dark, im, vignette)
    im = add_noise(im, seed=seed)
    im.convert('RGB').save(OUT / name, quality=88, optimize=True, progressive=True)


save_variant('auth-arena.jpg', (1500, 1800), (0.48, 0.48), (35, 9, 18), contrast=1.12, saturation=0.88, brightness=0.9, left_alpha=105, right_alpha=125, seed=1)
save_variant('community-cage.jpg', (1920, 1000), (0.70, 0.38), (4, 20, 40), contrast=1.12, saturation=0.94, brightness=0.78, left_alpha=245, right_alpha=85, red=False, blue=True, seed=2)
save_variant('editorial-red.jpg', (1920, 1000), (0.18, 0.36), (42, 5, 12), contrast=1.14, saturation=1.0, brightness=0.77, left_alpha=242, right_alpha=80, red=True, blue=False, seed=3)
save_variant('profile-corner.jpg', (1920, 1000), (0.50, 0.42), (15, 10, 30), contrast=1.1, saturation=0.88, brightness=0.75, left_alpha=218, right_alpha=95, red=True, blue=True, seed=4)
save_variant('rewards-vault.jpg', (1920, 1000), (0.35, 0.55), (33, 20, 3), contrast=1.15, saturation=0.8, brightness=0.72, left_alpha=240, right_alpha=90, red=True, blue=False, seed=5)
save_variant('league-night.jpg', (1920, 1000), (0.62, 0.48), (5, 24, 42), contrast=1.13, saturation=0.84, brightness=0.74, left_alpha=240, right_alpha=88, red=False, blue=True, seed=6)
save_variant('admin-command.jpg', (1920, 1080), (0.5, 0.48), (16, 8, 22), blur=2.4, contrast=1.2, saturation=0.66, brightness=0.62, left_alpha=246, right_alpha=182, red=True, blue=True, seed=7)
save_variant('legal-vault.jpg', (1920, 900), (0.50, 0.62), (12, 15, 20), blur=1.2, contrast=1.08, saturation=0.55, brightness=0.62, left_alpha=247, right_alpha=145, red=False, blue=True, seed=8)

print('\n'.join(str(p.relative_to(ROOT)) for p in sorted(OUT.glob('*.jpg'))))
