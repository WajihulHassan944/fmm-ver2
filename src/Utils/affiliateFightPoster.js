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

/**
 * Build one personalized poster.
 * Returns { blob, dataUrl, width, height, format, url, cta }.
 */
export async function buildAffiliateFightPoster({
  format = 'feed', url, affiliate, artUrl, fighterAImage, fighterBImage,
  fighterA, fighterB, event, date, loadImage = defaultLoadImage,
}) {
  const spec = POSTER_FORMATS[format];
  if (!spec) throw new Error('Unknown poster format.');
  if (!url || !/^https:\/\//i.test(url)) throw new Error('This affiliate does not have a tracked fight link yet.');

  // Low error correction keeps the long tracked link at a scannable density
  // (version 6, 41 modules); the code is never covered, so it needs no extra
  // damage tolerance.
  const qrDataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'L', margin: 4, scale: 1, color: { dark: '#000000', light: '#ffffff' } });
  await loadFonts();
  const [art, qr, logo] = await Promise.all([loadImage(artUrl), loadImage(qrDataUrl), loadImage(LOGO)]);
  if (!qr) throw new Error('Could not create the QR code.');
  let left = null;
  let right = null;
  if (!art) {
    [left, right] = await Promise.all([loadImage(fighterAImage), loadImage(fighterBImage)]);
    if (!left && !right) throw new Error('This fight has no poster artwork or fighter photos saved in the Fight Registry yet.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  drawBackdrop(ctx, art || left || right, spec);
  if (art) drawArtwork(ctx, art, spec);
  else drawFighterPair(ctx, left, right, spec, fighterA, fighterB);

  const cta = posterCallToAction(affiliate);
  const details = { cta, qr, logo, fighterA, fighterB, date, event };
  if (format === 'story') drawStoryPanel(ctx, spec, details);
  else drawFeedPanel(ctx, spec, details);

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
