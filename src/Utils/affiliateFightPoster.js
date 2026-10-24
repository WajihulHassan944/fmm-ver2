import QRCode from 'qrcode';
import { resolvePublicMediaUrl } from '@/Utils/publicApi';

// Personalized affiliate fight posters (Issue #180).
//
// The poster is drawn once in the browser and that exact PNG is what the
// affiliate previews, downloads, copies and shares, so the preview always
// matches the export. The fight artwork from the Fight Registry is drawn
// whole (scaled to fit, never cropped) and a blurred copy of the same artwork
// fills the rest of the frame, so there are no black bars. The QR is
// generated from the affiliate's tracked fight link and composited last on a
// white card with its own quiet zone, so nothing is ever drawn over it.

export const POSTER_FORMATS = {
  feed: {
    key: 'feed', label: 'Feed', width: 1080, height: 1350,
    art: { top: 0, height: 1000 },
    panelTop: 1000,
  },
  story: {
    key: 'story', label: 'Story', width: 1080, height: 1920,
    // Panel sits above the bottom ~230px that Story apps cover with reply bars.
    art: { top: 130, height: 1060 },
    panelTop: 1190,
  },
};

const LOGO = '/images/fmm-experience/fantasy-mmadness-logo.png';
const DISPLAY_FONT = "Anton, Impact, 'Arial Black', sans-serif";
const TEXT_FONT = "Rajdhani, 'Arial Narrow', Arial, sans-serif";
const GOLD = '#ffc94d';
const INK = '#06080f';

/** First name for the CTA, from the affiliate record only. */
export function getAffiliateFirstName(affiliate) {
  const raw = String(affiliate?.firstName || '').trim().split(/\s+/)[0] || '';
  const cleaned = raw.normalize('NFC').replace(/[^\p{L}\p{M}'’.-]/gu, '');
  return cleaned.slice(0, 18);
}

/** "KELLY'S", "JAMES'" — names ending in S take the bare apostrophe. */
export function possessiveName(firstName) {
  const name = String(firstName || '').trim().toUpperCase();
  if (!name) return '';
  return /S$/.test(name) ? `${name}'` : `${name}'S`;
}

/** The CTA words, split so the name can be drawn in gold. */
export function posterCallToAction(affiliate) {
  const owner = possessiveName(getAffiliateFirstName(affiliate));
  return owner
    ? { lead: 'JOIN ', name: owner, tail: ' LEAGUE', text: `JOIN ${owner} LEAGUE` }
    : { lead: 'JOIN ', name: 'MY', tail: ' LEAGUE', text: 'JOIN MY LEAGUE' };
}

const proxiedSource = (src) => {
  const resolved = resolvePublicMediaUrl(src);
  return /^https:\/\//i.test(resolved) ? `/api/fight-poster-image?url=${encodeURIComponent(resolved)}` : resolved;
};

const defaultLoadImage = (src) => new Promise((resolve) => {
  if (!src) { resolve(null); return; }
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.onload = () => resolve(image.naturalWidth > 0 ? image : null);
  image.onerror = () => resolve(null);
  image.src = src.startsWith('data:') ? src : proxiedSource(src);
});

const loadFonts = async () => {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  await Promise.race([
    Promise.all([
      document.fonts.load(`400 96px ${DISPLAY_FONT}`),
      document.fonts.load(`700 34px ${TEXT_FONT}`),
      document.fonts.load(`600 28px ${TEXT_FONT}`),
    ]).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);
};

const containRect = (image, x, y, width, height) => {
  const scale = Math.min(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  return { x: x + (width - w) / 2, y: y + (height - h) / 2, w, h };
};

const coverRect = (image, x, y, width, height) => {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  return { x: x + (width - w) / 2, y: y + (height - h) / 2, w, h };
};

const fitFont = (ctx, text, maxWidth, maxSize, minSize, family, weight = '400') => {
  let size = maxSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
};

const fitLine = (ctx, text, maxWidth, maxSize, minSize, family, weight) => {
  let value = String(text || '');
  fitFont(ctx, value, maxWidth, maxSize, minSize, family, weight);
  while (value.length > 4 && ctx.measureText(value).width > maxWidth) value = `${value.slice(0, -2).trimEnd()}…`;
  return value;
};

// Blurred, darkened copy of the artwork behind everything: full-bleed color
// with no black margins, whatever the artwork's shape.
const drawBackdrop = (ctx, art, spec) => {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, spec.width, spec.height);
  if (art) {
    const r = coverRect(art, -60, -60, spec.width + 120, spec.height + 120);
    ctx.save();
    if ('filter' in ctx) ctx.filter = 'blur(34px) saturate(1.25)';
    ctx.drawImage(art, r.x, r.y, r.w, r.h);
    ctx.restore();
    ctx.fillStyle = 'rgba(4, 6, 14, 0.58)';
    ctx.fillRect(0, 0, spec.width, spec.height);
  }
  const blue = ctx.createRadialGradient(0, spec.height * 0.45, 20, 0, spec.height * 0.45, spec.width * 0.75);
  blue.addColorStop(0, 'rgba(26, 92, 255, 0.30)'); blue.addColorStop(1, 'rgba(26, 92, 255, 0)');
  ctx.fillStyle = blue; ctx.fillRect(0, 0, spec.width, spec.height);
  const red = ctx.createRadialGradient(spec.width, spec.height * 0.45, 20, spec.width, spec.height * 0.45, spec.width * 0.75);
  red.addColorStop(0, 'rgba(242, 22, 52, 0.30)'); red.addColorStop(1, 'rgba(242, 22, 52, 0)');
  ctx.fillStyle = red; ctx.fillRect(0, 0, spec.width, spec.height);
};

// The registry artwork itself, whole and uncropped.
const drawArtwork = (ctx, art, spec) => {
  const r = containRect(art, 0, spec.art.top, spec.width, spec.art.height);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 40;
  ctx.drawImage(art, r.x, r.y, r.w, r.h);
  ctx.restore();
  return r;
};

// Used only when a fight has no registry poster: the two saved fighter photos,
// each shown whole on its own side. Never a stock or substitute photo.
const drawFighterPair = (ctx, left, right, spec, fighterA, fighterB) => {
  const { top, height } = spec.art;
  const half = spec.width / 2;
  const labels = [fighterA, fighterB].map((name) => String(name || '').toUpperCase());
  const labelSize = Math.min(...labels.map((label) => fitFont(ctx, label, half - 40, 64, 30, DISPLAY_FONT, '400')));
  [[left, 0, 'rgba(26,92,255,0.22)', labels[0]], [right, half, 'rgba(242,22,52,0.22)', labels[1]]].forEach(([image, x, tint, label]) => {
    ctx.fillStyle = tint; ctx.fillRect(x, top, half, height);
    if (image) {
      const r = containRect(image, x + 10, top + 20, half - 20, height - 150);
      ctx.drawImage(image, r.x, r.y, r.w, r.h);
    }
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 16;
    ctx.font = `400 ${labelSize}px ${DISPLAY_FONT}`;
    ctx.fillText(label, x + half / 2, top + height - 50, half - 40);
    ctx.shadowBlur = 0;
  });
  ctx.fillStyle = GOLD; ctx.textAlign = 'center';
  ctx.font = `400 96px ${DISPLAY_FONT}`;
  ctx.fillText('VS', half, top + height / 2);
};

const drawLogo = (ctx, logo, x, y, size) => {
  if (!logo) return;
  ctx.save();
  // The logo file has a dark square backdrop; screen blending drops it.
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(logo, x, y, size, size);
  ctx.restore();
};

const drawCta = (ctx, cta, centerX, baseline, maxWidth, maxSize, align) => {
  const size = fitFont(ctx, cta.text, maxWidth, maxSize, 40, DISPLAY_FONT, '400');
  ctx.font = `400 ${size}px ${DISPLAY_FONT}`;
  const parts = [[cta.lead, '#ffffff'], [cta.name, GOLD], [cta.tail, '#ffffff']];
  const total = parts.reduce((sum, [text]) => sum + ctx.measureText(text).width, 0);
  let x = align === 'center' ? centerX - total / 2 : centerX;
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 18;
  parts.forEach(([text, color]) => {
    ctx.fillStyle = color;
    ctx.fillText(text, x, baseline);
    x += ctx.measureText(text).width;
  });
  ctx.shadowBlur = 0;
};

// The QR image is generated at one pixel per module (plus its 4-module quiet
// zone) and enlarged by a whole number so every module stays a crisp square.
const qrDrawSize = (qr, target) => qr.width * Math.max(1, Math.floor(target / qr.width));

// White card + QR with its quiet zone; drawn last, nothing overlaps it.
const drawQr = (ctx, qr, x, y, size) => {
  const pad = 8;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - pad, y - pad, size + pad * 2, size + pad * 2, 18);
  else ctx.rect(x - pad, y - pad, size + pad * 2, size + pad * 2);
  ctx.fill();
  ctx.restore();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qr, x, y, size, size);
  ctx.imageSmoothingEnabled = true;
};

const goldRule = (ctx, y, width) => {
  const rule = ctx.createLinearGradient(0, 0, width, 0);
  rule.addColorStop(0, 'rgba(255,201,77,0)'); rule.addColorStop(0.5, GOLD); rule.addColorStop(1, 'rgba(255,201,77,0)');
  ctx.save(); ctx.shadowColor = '#ff8a00'; ctx.shadowBlur = 14;
  ctx.fillStyle = rule; ctx.fillRect(0, y - 2, width, 4);
  ctx.restore();
};

const panelFill = (ctx, spec) => {
  const fade = ctx.createLinearGradient(0, spec.panelTop, 0, spec.height);
  fade.addColorStop(0, 'rgba(6, 8, 15, 0.88)'); fade.addColorStop(1, 'rgba(6, 8, 15, 0.97)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, spec.panelTop, spec.width, spec.height - spec.panelTop);
};

const matchupLine = (fighterA, fighterB) => [fighterA, fighterB]
  .filter(Boolean).map((name) => String(name).toUpperCase()).join(' VS ');

const eventLine = (event, date) => [event || 'FANTASY MMADNESS', date]
  .filter(Boolean).map((part) => String(part).toUpperCase()).join('  •  ');

const drawFeedPanel = (ctx, spec, { cta, qr, logo, fighterA, fighterB, date, event }) => {
  panelFill(ctx, spec);
  goldRule(ctx, spec.panelTop, spec.width);
  const qrSize = qrDrawSize(qr, 312);
  const qrX = spec.width - 40 - qrSize;
  const qrY = spec.panelTop + Math.round((spec.height - spec.panelTop - qrSize) / 2) + 4;
  const textLeft = 48;
  const textWidth = qrX - 34 - textLeft;
  drawLogo(ctx, logo, textLeft - 8, spec.panelTop + 26, 74);
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = `700 30px ${TEXT_FONT}`;
  ctx.fillText(fitLine(ctx, eventLine(event, date), textWidth - 80, 30, 20, TEXT_FONT, '700'), textLeft + 76, spec.panelTop + 74);
  drawCta(ctx, cta, textLeft, spec.panelTop + 194, textWidth, 96, 'left');
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 36px ${TEXT_FONT}`;
  ctx.fillText('SCAN TO MAKE YOUR PICKS', textLeft, spec.panelTop + 250, textWidth);
  ctx.fillStyle = '#c9d2e8';
  ctx.fillText(fitLine(ctx, matchupLine(fighterA, fighterB), textWidth, 28, 18, TEXT_FONT, '600'), textLeft, spec.panelTop + 298);
  drawQr(ctx, qr, qrX, qrY, qrSize);
};

const drawStoryPanel = (ctx, spec, { cta, qr, logo, fighterA, fighterB, date, event }) => {
  drawLogo(ctx, logo, (spec.width - 120) / 2, 4, 120);
  panelFill(ctx, spec);
  goldRule(ctx, spec.panelTop, spec.width);
  const center = spec.width / 2;
  drawCta(ctx, cta, center, spec.panelTop + 100, spec.width - 90, 112, 'center');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 40px ${TEXT_FONT}`;
  ctx.fillText('SCAN TO MAKE YOUR PICKS', center, spec.panelTop + 158);
  const qrSize = qrDrawSize(qr, 344);
  drawQr(ctx, qr, center - qrSize / 2, spec.panelTop + 186, qrSize);
  ctx.fillStyle = GOLD;
  ctx.fillText(fitLine(ctx, eventLine(event, date), spec.width - 120, 34, 22, TEXT_FONT, '700'), center, spec.panelTop + 584);
  ctx.fillStyle = '#c9d2e8';
  ctx.fillText(fitLine(ctx, matchupLine(fighterA, fighterB), spec.width - 120, 30, 18, TEXT_FONT, '600'), center, spec.panelTop + 628);
};

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
  if (canvas.toBlob) canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not export the poster image.'))), 'image/png');
  else reject(new Error('This browser cannot export images.'));
});

// ---------------------------------------------------------------------------
// Approved FANTASY MMADNESS promo template (Issue #182 reference, UFC 333):
// arena art behind two large fighters, gold event header, MAIN EVENT and huge
// gold stacked names, then PLAY / PREDICT / COMPETE — red-framed QR with the
// FM crown — JOIN <NAME>'S LEAGUE with a red arrow, the FANTASY MMADNESS
// lockup and the five-sports strip. Only facts from the Fight Registry are
// drawn (event, date, venue, names); nothing is invented.
// ---------------------------------------------------------------------------
const KIT = {
  brand: '/images/poster-kit/fmm-brand-lockup.png',
  crown: '/images/poster-kit/fmm-qr-crown.png',
  strip: '/images/poster-kit/fmm-sports-strip.png',
};
const RED = '#e3141f';

const LAYOUT = {
  feed: {
    header: { y: 18, h: 160, w: 470 }, fighters: { top: 60, bottom: 880 },
    names: { mainEvent: 494, a: 612, vs: 648, b: 762, size: 116, width: 900 },
    row: { y: 792, qr: 250 }, brand: { y: 1080, w: 420 }, strip: { h: 124 },
  },
  story: {
    header: { y: 150, h: 196, w: 520 }, fighters: { top: 210, bottom: 1220 },
    names: { mainEvent: 800, a: 946, vs: 988, b: 1130, size: 148, width: 960 },
    row: { y: 1168, qr: 344 }, brand: { y: 1572, w: 540 }, strip: { h: 156 },
  },
};

const goldFill = (ctx, top, bottom) => {
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, '#fff6c8'); g.addColorStop(0.35, '#f8d264'); g.addColorStop(0.7, '#e2a72e'); g.addColorStop(1, '#a8701a');
  return g;
};

// Fighter photo drawn large (cover, anchored at the top so heads stay in
// frame), faded toward the centre and bottom so it melts into the arena.
const drawPromoFighter = (ctx, image, side, spec, box) => {
  const half = spec.width / 2;
  const w = half + 90;
  const h = box.bottom - box.top;
  const x = side === 'A' ? -60 : spec.width - w + 60;
  const layer = document.createElement('canvas');
  layer.width = Math.round(w); layer.height = Math.round(h);
  const l = layer.getContext('2d');
  const scale = Math.max(w / image.width, h / image.height);
  const dw = image.width * scale; const dh = image.height * scale;
  l.drawImage(image, (w - dw) / 2, 0, dw, dh);
  l.globalCompositeOperation = 'destination-in';
  const across = l.createLinearGradient(0, 0, w, 0);
  if (side === 'A') { across.addColorStop(0, '#000'); across.addColorStop(0.72, '#000'); across.addColorStop(1, 'rgba(0,0,0,0)'); }
  else { across.addColorStop(0, 'rgba(0,0,0,0)'); across.addColorStop(0.28, '#000'); across.addColorStop(1, '#000'); }
  l.fillStyle = across; l.fillRect(0, 0, w, h);
  const down = l.createLinearGradient(0, 0, 0, h);
  down.addColorStop(0, 'rgba(0,0,0,0)'); down.addColorStop(0.1, '#000'); down.addColorStop(0.7, '#000'); down.addColorStop(1, 'rgba(0,0,0,0)');
  l.fillStyle = down; l.fillRect(0, 0, w, h);
  ctx.drawImage(layer, x, box.top);
};

const drawArena = (ctx, art, spec) => {
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, spec.width, spec.height);
  if (art) {
    const r = coverRect(art, 0, 0, spec.width, spec.height);
    ctx.save();
    if ('filter' in ctx) ctx.filter = 'blur(2px) brightness(0.62) saturate(1.15)';
    ctx.drawImage(art, r.x, r.y, r.w, r.h);
    ctx.restore();
  }
  // Warm stadium spotlights across the top.
  [0.08, 0.27, 0.5, 0.73, 0.92].forEach((fx, i) => {
    const x = spec.width * fx; const y = 30 + (i % 2) * 40;
    const spot = ctx.createRadialGradient(x, y, 2, x, y, 260);
    spot.addColorStop(0, 'rgba(255,236,170,0.55)'); spot.addColorStop(0.2, 'rgba(255,196,80,0.22)'); spot.addColorStop(1, 'rgba(255,190,60,0)');
    ctx.fillStyle = spot; ctx.fillRect(0, 0, spec.width, spec.height * 0.6);
  });
  const shade = ctx.createLinearGradient(0, 0, 0, spec.height);
  shade.addColorStop(0, 'rgba(0,0,0,0.15)'); shade.addColorStop(0.45, 'rgba(0,0,0,0.2)'); shade.addColorStop(0.62, 'rgba(0,0,0,0.65)'); shade.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, spec.width, spec.height);
};

const drawRedSmoke = (ctx, spec, y) => {
  [[0, y + 140], [spec.width, y + 140]].forEach(([x, cy]) => {
    const g = ctx.createRadialGradient(x, cy, 10, x, cy, 330);
    g.addColorStop(0, 'rgba(210,20,30,0.55)'); g.addColorStop(1, 'rgba(210,20,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - 200, spec.width, 600);
  });
};

const drawHeader = (ctx, spec, layout, { event, date, venue }) => {
  const { y, h, w } = layout.header;
  const x = (spec.width - w) / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(x, y, w, h);
  ctx.textAlign = 'center';
  const title = String(event || 'FIGHT NIGHT').toUpperCase();
  const size = fitFont(ctx, title, w - 40, Math.round(h * 0.44), 30, DISPLAY_FONT, '400');
  ctx.font = `400 ${size}px ${DISPLAY_FONT}`;
  ctx.fillStyle = goldFill(ctx, y + 10, y + 10 + size);
  ctx.fillText(title, spec.width / 2, y + 12 + size * 0.92, w - 40);
  let line = y + 12 + size * 0.92;
  if (date) {
    ctx.fillStyle = '#ffffff'; ctx.font = `700 ${Math.round(h * 0.2)}px ${TEXT_FONT}`;
    line += Math.round(h * 0.25); ctx.fillText(String(date).toUpperCase(), spec.width / 2, line, w - 30);
  }
  if (venue) {
    ctx.fillStyle = GOLD; ctx.font = `700 ${Math.round(h * 0.15)}px ${TEXT_FONT}`;
    line += Math.round(h * 0.19); ctx.fillText(fitLine(ctx, String(venue).toUpperCase(), w - 30, Math.round(h * 0.15), 14, TEXT_FONT, '700'), spec.width / 2, line);
  }
};

const goldName = (ctx, text, x, y, size, width) => {
  const value = String(text || '').toUpperCase();
  const fitted = fitFont(ctx, value, width, size, 48, DISPLAY_FONT, '400');
  ctx.font = `400 ${fitted}px ${DISPLAY_FONT}`;
  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6;
  ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,22,0,0.85)'; ctx.lineJoin = 'round';
  ctx.strokeText(value, x, y);
  ctx.restore();
  ctx.fillStyle = goldFill(ctx, y - fitted * 0.85, y);
  ctx.fillText(value, x, y);
};

const lastName = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
};

const drawNames = (ctx, spec, layout, { fighterA, fighterB }) => {
  const n = layout.names; const cx = spec.width / 2;
  const glow = ctx.createRadialGradient(cx, (n.mainEvent + n.b) / 2, 20, cx, (n.mainEvent + n.b) / 2, n.width * 0.62);
  glow.addColorStop(0, 'rgba(0,0,0,0.62)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, n.mainEvent - 120, spec.width, n.b - n.mainEvent + 200);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
  ctx.font = `400 ${Math.round(n.size * 0.32)}px ${DISPLAY_FONT}`;
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 12;
  ctx.fillText('MAIN EVENT', cx, n.mainEvent);
  ctx.shadowBlur = 0;
  goldName(ctx, lastName(fighterA) || fighterA, cx, n.a, n.size, n.width);
  const vsSize = Math.round(n.size * 0.34);
  ctx.save(); ctx.font = `italic 400 ${vsSize}px ${DISPLAY_FONT}`; ctx.fillStyle = '#e9e9ee';
  const vsBase = n.vs + vsSize * 0.36;
  ctx.setTransform(1, 0, -0.18, 1, vsBase * 0.18, 0); ctx.fillText('VS', cx, vsBase); ctx.restore();
  const line = ctx.createLinearGradient(cx - 260, 0, cx + 260, 0);
  line.addColorStop(0, 'rgba(248,210,100,0)'); line.addColorStop(0.3, '#f8d264'); line.addColorStop(0.7, '#f8d264'); line.addColorStop(1, 'rgba(248,210,100,0)');
  ctx.fillStyle = line; ctx.fillRect(cx - 270, n.vs - 1, 205, 3); ctx.fillRect(cx + 65, n.vs - 1, 205, 3);
  goldName(ctx, lastName(fighterB) || fighterB, cx, n.b, n.size, n.width);
};

// Italic poster type (skewed Anton), drawn with a dark outline for contrast.
const italicLine = (ctx, text, x, y, size, color, align = 'left') => {
  ctx.save();
  ctx.font = `400 ${size}px ${DISPLAY_FONT}`;
  ctx.textAlign = align;
  ctx.setTransform(1, 0, -0.2, 1, y * 0.2, 0);
  ctx.lineWidth = Math.max(4, size * 0.08); ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
  ctx.restore();
};

const drawPromoRow = (ctx, spec, layout, { qr, crown, cta }) => {
  const { y, qr: qrTarget } = layout.row;
  const qrSize = qrDrawSize(qr, qrTarget);
  const cardPad = Math.round(qrSize * 0.06);
  const card = qrSize + cardPad * 2;
  const cx = spec.width / 2;
  const cardX = Math.round(cx - card / 2);
  const cardY = y;
  // Left: PLAY / PREDICT / COMPETE
  const leftRight = cardX - 34;
  const words = [['PLAY', '#ffffff'], ['PREDICT', RED], ['COMPETE', '#ffffff']];
  const size = Math.round(card * 0.26);
  words.forEach(([word, color], i) => italicLine(ctx, word, leftRight, cardY + size * 1.05 + i * size * 1.02, size, color, 'right'));
  const swoosh = ctx.createLinearGradient(leftRight - 260, 0, leftRight, 0);
  swoosh.addColorStop(0, 'rgba(227,20,31,0)'); swoosh.addColorStop(1, RED);
  ctx.fillStyle = swoosh; ctx.beginPath();
  const sy = cardY + size * 3.35;
  ctx.moveTo(leftRight - 270, sy + 10); ctx.lineTo(leftRight, sy - 6); ctx.lineTo(leftRight - 8, sy + 4); ctx.closePath(); ctx.fill();
  // Centre: red-framed white QR card with the FM crown.
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 26;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(cardX, cardY, card, card); ctx.restore();
  ctx.lineWidth = Math.max(5, Math.round(card * 0.022)); ctx.strokeStyle = RED;
  ctx.strokeRect(cardX + ctx.lineWidth / 2, cardY + ctx.lineWidth / 2, card - ctx.lineWidth, card - ctx.lineWidth);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qr, cardX + cardPad, cardY + cardPad, qrSize, qrSize);
  ctx.imageSmoothingEnabled = true;
  if (crown) {
    const badge = Math.round(qrSize * 0.15);
    const bx = Math.round(cx - badge / 2); const by = Math.round(cardY + card / 2 - badge / 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx - 4, by - 4, badge + 8, badge + 8);
    ctx.drawImage(crown, bx, by, badge, badge);
  }
  // Right: JOIN <NAME>'S / LEAGUE with an arrow to the QR.
  const rightLeft = cardX + card + 30;
  const maxW = spec.width - rightLeft - 26;
  const top = `JOIN ${cta.name === 'MY' ? 'MY' : cta.name}`;
  const topSize = fitFont(ctx, top, maxW, Math.round(card * 0.24), 34, DISPLAY_FONT, '400');
  italicLine(ctx, top, rightLeft, cardY + card * 0.34, topSize, '#ffffff');
  const leagueSize = Math.min(Math.round(card * 0.3), fitFont(ctx, 'LEAGUE', maxW, Math.round(card * 0.3), 34, DISPLAY_FONT, '400'));
  italicLine(ctx, 'LEAGUE', rightLeft, cardY + card * 0.34 + leagueSize * 1.02, leagueSize, RED);
  // Curved arrow from under the CTA into the QR card's right edge.
  const ax = rightLeft + Math.min(maxW, 200) * 0.75; const ay = cardY + card * 0.68;
  const tipX = cardX + card + 12; const tipY = cardY + card * 0.8;
  ctx.strokeStyle = RED; ctx.lineWidth = Math.max(8, card * 0.035); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax - 10, tipY + 20, tipX + 34, tipY); ctx.stroke();
  ctx.fillStyle = RED; ctx.beginPath();
  ctx.moveTo(tipX, tipY); ctx.lineTo(tipX + 44, tipY - 26); ctx.lineTo(tipX + 40, tipY + 26); ctx.closePath(); ctx.fill();
  return cardY + card;
};

const drawBrandAndStrip = (ctx, spec, layout, { brand, strip }) => {
  if (brand) {
    const w = layout.brand.w; const h = w * (brand.height / brand.width);
    ctx.drawImage(brand, (spec.width - w) / 2, layout.brand.y, w, h);
  }
  const sh = layout.strip.h; const sy = spec.height - sh;
  ctx.fillStyle = '#000000'; ctx.fillRect(0, sy, spec.width, sh);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, sy, spec.width, 2);
  if (strip) {
    const w = Math.min(spec.width, sh * (strip.width / strip.height)); const h = w * (strip.height / strip.width);
    ctx.drawImage(strip, (spec.width - w) / 2, sy + (sh - h) / 2, w, h);
  }
};

/**
 * Build one personalized poster in the approved FANTASY MMADNESS design.
 * Returns { blob, dataUrl, width, height, format, url, cta }.
 */
export async function buildAffiliateFightPoster({
  format = 'feed', url, affiliate, artUrl, fighterAImage, fighterBImage,
  fighterA, fighterB, event, date, venue, loadImage = defaultLoadImage,
}) {
  const spec = POSTER_FORMATS[format];
  const layout = LAYOUT[format];
  if (!spec || !layout) throw new Error('Unknown poster format.');
  if (!url || !/^https:\/\//i.test(url)) throw new Error('This affiliate does not have a tracked fight link yet.');

  // M-level error correction (15% recoverable) covers the small FM crown in
  // the centre (~3% of the code) and keeps the code at version 7, so modules
  // stay large enough to scan from a phone. Quiet zone: 2 modules plus the
  // white card margin.
  const qrDataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, scale: 1, color: { dark: '#000000', light: '#ffffff' } });
  await loadFonts();
  const [art, left, right, qr, brand, crown, strip] = await Promise.all([
    loadImage(artUrl), loadImage(fighterAImage), loadImage(fighterBImage), loadImage(qrDataUrl),
    loadImage(KIT.brand), loadImage(KIT.crown), loadImage(KIT.strip),
  ]);
  if (!qr) throw new Error('Could not create the QR code.');
  if (!art && !left && !right) throw new Error('This fight has no artwork or fighter photos in the Fight Registry yet.');

  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  drawArena(ctx, art || left || right, spec);
  if (left) drawPromoFighter(ctx, left, 'A', spec, layout.fighters);
  if (right) drawPromoFighter(ctx, right, 'B', spec, layout.fighters);
  if (!left && !right && art) {
    // No fighter photos: show the registry artwork itself, whole, as the hero.
    const r = containRect(art, 40, layout.fighters.top, spec.width - 80, layout.names.mainEvent - layout.fighters.top - 60);
    ctx.drawImage(art, r.x, r.y, r.w, r.h);
  }
  drawRedSmoke(ctx, spec, layout.row.y);
  drawHeader(ctx, spec, layout, { event, date, venue });
  drawNames(ctx, spec, layout, { fighterA, fighterB });
  const cta = posterCallToAction(affiliate);
  drawPromoRow(ctx, spec, layout, { qr, crown, cta });
  drawBrandAndStrip(ctx, spec, layout, { brand, strip });

  const blob = await canvasToBlob(canvas);
  return { blob, dataUrl: canvas.toDataURL('image/png'), width: spec.width, height: spec.height, format, url, cta: cta.text };
}

export function posterFileName({ format, firstName, fightId }) {
  const who = String(firstName || 'my').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my';
  const id = String(fightId || 'fight').replace(/[^a-z0-9]/gi, '').slice(-8);
  const size = POSTER_FORMATS[format] ? `${POSTER_FORMATS[format].width}x${POSTER_FORMATS[format].height}` : '';
  return `fantasy-mmadness-${who}-league-${format}-${size}-${id}.png`;
}

export function downloadPosterBlob(blob, fileName) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 30000);
}
