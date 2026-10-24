import QRCode from 'qrcode';
import { resolvePublicMediaUrl } from '@/Utils/publicApi';

// Personalized affiliate fight posters (Issues #180 / #182).
//
// The poster is drawn once in the browser and that exact PNG is what is
// previewed, downloaded, copied and shared, so the preview always matches the
// export. See "FANTASY MMADNESS promotional overlay" below for the layout.

export const POSTER_FORMATS = {
  feed: { key: 'feed', label: 'Feed', width: 1080, height: 1350 },
  story: { key: 'story', label: 'Story', width: 1080, height: 1920 },
};

const DISPLAY_FONT = "Anton, Impact, 'Arial Black', sans-serif";
const TEXT_FONT = "Rajdhani, 'Arial Narrow', Arial, sans-serif";
const GOLD = '#ffc94d';

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

const fitFont = (ctx, text, maxWidth, maxSize, minSize, family, weight = '400') => {
  let size = maxSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
};

// ---------------------------------------------------------------------------
// FANTASY MMADNESS promotional overlay (Issue #182, owner direction 2026-10-24).
//
// The fight's own poster from the Fight Registry is the poster. It is drawn
// exactly once, whole, at its own proportions (scaled to fit — never cropped,
// stretched, filtered, recolored or drawn over). Its outer edge fades softly
// into a blurred, darkened extension of the same artwork that fills the rest
// of the frame, so the result reads as one poster. The FANTASY MMADNESS
// elements sit on that extension, never on top of the fight artwork:
//   • the official FANTASY MMADNESS logo with the FM crown and the tagline
//     "WE DON'T PICK WINNERS... WE PREDICT HISTORY."
//   • PLAY / PREDICT / COMPETE
//   • JOIN <FIRSTNAME>'S LEAGUE
//   • the affiliate's tracked QR code (red frame, FM crown on the frame edge,
//     outside the code and its quiet zone so it never hurts scanning).
// Nothing about the fight is re-typed or invented; the poster already says it.
// ---------------------------------------------------------------------------
const KIT = {
  brand: '/images/poster-kit/fmm-brand-lockup.png', // logo + FM crown + tagline
  crown: '/images/poster-kit/fmm-qr-crown.png',
};
const RED = '#e3141f';
const BRAND_RATIO = 218 / 640; // height / width of the brand lockup image

// Two arrangements per format. "split": logo band above the poster and the
// QR row below it (used when the poster leaves enough room). "stacked": the
// QR row and the logo both below the poster (used for taller posters, which
// are scaled down to make room rather than covered).
const PLANS = {
  feed: {
    split: { brandW: 520, brandPad: 16, card: 330, rowPad: 54, bottomPad: 24 },
    stacked: { brandW: 340, card: 286, rowPad: 50, gap: 14, bottomPad: 18 },
  },
  story: {
    // Keep the QR above the bottom area that Story apps cover with reply bars.
    split: { brandW: 700, brandPad: 40, card: 390, rowPad: 64, bottomPad: 150 },
    stacked: { brandW: 560, card: 360, rowPad: 60, gap: 18, bottomPad: 130 },
  },
};

const brandHeight = (w) => Math.round(w * BRAND_RATIO);

/** Where the original poster and each promo element go on this canvas. */
export function planOverlay(format, artWidth, artHeight) {
  const spec = POSTER_FORMATS[format];
  const plans = PLANS[format];
  if (!spec || !plans) throw new Error('Unknown poster format.');
  const fit = (boxW, boxH) => {
    const scale = Math.min(boxW / artWidth, boxH / artHeight);
    return { w: Math.round(artWidth * scale), h: Math.round(artHeight * scale) };
  };
  const { split, stacked } = plans;
  const topBand = brandHeight(split.brandW) + split.brandPad * 2;
  const rowBand = split.rowPad + split.card + split.bottomPad;
  const roomForSplit = spec.height - topBand - rowBand;
  const splitArt = fit(spec.width, roomForSplit);
  if (splitArt.w >= spec.width - 1) {
    // Poster spans the full width: logo band on top, poster, then the QR row
    // centred in whatever space is left below.
    const art = { x: 0, y: topBand, w: spec.width, h: splitArt.h };
    const below = spec.height - (art.y + art.h) - split.bottomPad;
    const rowY = art.y + art.h + Math.max(split.rowPad, Math.round((below - split.card) / 2 + 20));
    return {
      mode: 'split', spec, art,
      brand: { x: Math.round((spec.width - split.brandW) / 2), y: split.brandPad, w: split.brandW, h: brandHeight(split.brandW) },
      row: { y: rowY, card: split.card },
    };
  }
  const panel = stacked.rowPad + stacked.card + stacked.gap + brandHeight(stacked.brandW) + stacked.bottomPad;
  const box = fit(spec.width, spec.height - panel);
  const art = { x: Math.round((spec.width - box.w) / 2), y: 0, w: box.w, h: box.h };
  // Any spare height is shared evenly above and below the promo block.
  const spare = Math.max(0, spec.height - art.h - panel);
  const rowY = art.h + stacked.rowPad + Math.round(spare / 2);
  return {
    mode: 'stacked', spec, art,
    brand: { x: Math.round((spec.width - stacked.brandW) / 2), y: rowY + stacked.card + stacked.gap, w: stacked.brandW, h: brandHeight(stacked.brandW) },
    row: { y: rowY, card: stacked.card },
  };
}

// One continuous background: the fight poster's own artwork, enlarged to
// fill the frame, softly blurred and darkened, so the poster's colours carry
// all the way to the edges. Extra shade is laid where the FANTASY MMADNESS
// elements sit so they read clearly, plus warm FM red/gold light.
const drawExtension = (ctx, spec, art, plan) => {
  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, spec.width, spec.height);
  const scale = Math.max(spec.width / art.width, spec.height / art.height) * 1.08;
  const w = art.width * scale; const h = art.height * scale;
  const cx = plan.art.x + plan.art.w / 2; const cy = plan.art.y + plan.art.h / 2;
  ctx.save();
  if ('filter' in ctx) ctx.filter = 'blur(26px) saturate(1.2) brightness(0.62)';
  ctx.drawImage(art, Math.min(0, Math.max(spec.width - w, cx - w / 2)), Math.min(0, Math.max(spec.height - h, cy - h / 2)), w, h);
  ctx.restore();
  // General dim (also covers browsers without canvas filters).
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(0, 0, spec.width, spec.height);
  const top = plan.art.y; const bottom = plan.art.y + plan.art.h;
  if (top > 0) {
    const g = ctx.createLinearGradient(0, 0, 0, top + 40);
    g.addColorStop(0, 'rgba(0,0,0,0.78)'); g.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, spec.width, top + 40);
  }
  if (bottom < spec.height) {
    const g = ctx.createLinearGradient(0, bottom - 40, 0, spec.height);
    g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(0.35, 'rgba(0,0,0,0.62)'); g.addColorStop(1, 'rgba(0,0,0,0.86)');
    ctx.fillStyle = g; ctx.fillRect(0, bottom - 40, spec.width, spec.height - bottom + 40);
  }
  const ry = plan.row.y + plan.row.card / 2;
  [[0, ry], [spec.width, ry]].forEach(([x, y]) => {
    const g = ctx.createRadialGradient(x, y, 10, x, y, 460);
    g.addColorStop(0, 'rgba(214,18,30,0.5)'); g.addColorStop(1, 'rgba(214,18,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, spec.width, spec.height);
  });
  const by = plan.brand.y + plan.brand.h / 2;
  const glow = ctx.createRadialGradient(spec.width / 2, by, 10, spec.width / 2, by, plan.brand.w * 0.7);
  glow.addColorStop(0, 'rgba(255,190,70,0.18)'); glow.addColorStop(1, 'rgba(255,190,70,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, spec.width, spec.height);
};

// The original poster, sharp and unaltered, with only a soft fade at the
// edges that meet the background so there is no hard line or box. Returns
// the inner rectangle that is drawn completely untouched.
const FEATHER = 0.07;
const drawBlendedPoster = (ctx, spec, art, rect) => {
  const layer = document.createElement('canvas');
  layer.width = spec.width; layer.height = spec.height;
  const l = layer.getContext('2d');
  l.imageSmoothingQuality = 'high';
  l.drawImage(art, rect.x, rect.y, rect.w, rect.h);
  const fy = Math.round(Math.min(80, rect.h * FEATHER));
  const fx = Math.round(Math.min(80, rect.w * FEATHER));
  const edges = {
    top: rect.y > 0 ? fy : 0,
    bottom: rect.y + rect.h < spec.height ? fy : 0,
    left: rect.x > 0 ? fx : 0,
    right: rect.x + rect.w < spec.width ? fx : 0,
  };
  l.globalCompositeOperation = 'destination-out';
  const fade = (x0, y0, x1, y1, rx, ry, rw, rh) => {
    const g = l.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.15, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g; l.fillRect(rx, ry, rw, rh);
  };
  if (edges.top) fade(0, rect.y, 0, rect.y + edges.top, rect.x, rect.y, rect.w, edges.top);
  if (edges.bottom) fade(0, rect.y + rect.h, 0, rect.y + rect.h - edges.bottom, rect.x, rect.y + rect.h - edges.bottom, rect.w, edges.bottom);
  if (edges.left) fade(rect.x, 0, rect.x + edges.left, 0, rect.x, rect.y, edges.left, rect.h);
  if (edges.right) fade(rect.x + rect.w, 0, rect.x + rect.w - edges.right, 0, rect.x + rect.w - edges.right, rect.y, edges.right, rect.h);
  ctx.drawImage(layer, 0, 0);
  return {
    x: rect.x + edges.left, y: rect.y + edges.top,
    w: rect.w - edges.left - edges.right, h: rect.h - edges.top - edges.bottom,
  };
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

// The QR image is generated at one pixel per module (plus its quiet zone)
// and enlarged by a whole number so every module stays a crisp square.
const qrDrawSize = (qr, target) => qr.width * Math.max(1, Math.floor(target / qr.width));

// PLAY / PREDICT / COMPETE — red-framed QR with the FM crown — JOIN <NAME>'S LEAGUE.
const drawPromoRow = (ctx, spec, row, { qr, crown, cta }) => {
  const qrSize = qrDrawSize(qr, Math.round(row.card * 0.88));
  const cardPad = Math.round(qrSize * 0.06);
  const card = qrSize + cardPad * 2;
  const cx = spec.width / 2;
  const cardX = Math.round(cx - card / 2);
  const cardY = row.y;
  // Left: PLAY / PREDICT / COMPETE
  const leftRight = cardX - 30;
  const words = [['PLAY', '#ffffff'], ['PREDICT', RED], ['COMPETE', '#ffffff']];
  const size = Math.min(Math.round(card * 0.26), fitFont(ctx, 'PREDICT', leftRight - 40, Math.round(card * 0.26), 30, DISPLAY_FONT, '400'));
  words.forEach(([word, color], i) => italicLine(ctx, word, leftRight, cardY + card * 0.5 - size * 1.02 + size * 0.38 + i * size * 1.02, size, color, 'right'));
  // Centre: white QR card in a red frame.
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 26;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(cardX, cardY, card, card); ctx.restore();
  ctx.lineWidth = Math.max(5, Math.round(card * 0.022)); ctx.strokeStyle = RED;
  ctx.strokeRect(cardX + ctx.lineWidth / 2, cardY + ctx.lineWidth / 2, card - ctx.lineWidth, card - ctx.lineWidth);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qr, cardX + cardPad, cardY + cardPad, qrSize, qrSize);
  ctx.imageSmoothingEnabled = true;
  if (crown) {
    // The FM crown rides on the top edge of the frame, outside the code.
    const badge = Math.round(card * 0.17);
    const bx = Math.round(cx - badge / 2); const by = Math.round(cardY - badge * 0.62);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#000000'; ctx.fillRect(bx - 3, by - 3, badge + 6, badge + 6); ctx.restore();
    ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.strokeRect(bx - 3, by - 3, badge + 6, badge + 6);
    ctx.drawImage(crown, bx, by, badge, badge);
  }
  // Right: JOIN <NAME>'S / LEAGUE with an arrow pointing at the QR.
  const rightLeft = cardX + card + 30;
  const maxW = spec.width - rightLeft - 30;
  const top = `JOIN ${cta.name}`;
  const topSize = fitFont(ctx, top, maxW, Math.round(card * 0.22), 28, DISPLAY_FONT, '400');
  const leagueSize = fitFont(ctx, 'LEAGUE', maxW, Math.round(card * 0.28), 28, DISPLAY_FONT, '400');
  const topBase = cardY + card * 0.36;
  italicLine(ctx, top, rightLeft, topBase, topSize, '#ffffff');
  italicLine(ctx, 'LEAGUE', rightLeft, topBase + leagueSize * 1.02, leagueSize, RED);
  const ax = rightLeft + Math.min(maxW, 200) * 0.7; const ay = topBase + leagueSize * 1.02 + 16;
  const tipX = cardX + card + 10; const tipY = cardY + card * 0.84;
  ctx.strokeStyle = RED; ctx.lineWidth = Math.max(7, card * 0.03); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax - 6, tipY + 16, tipX + 30, tipY); ctx.stroke();
  ctx.fillStyle = RED; ctx.beginPath();
  ctx.moveTo(tipX, tipY); ctx.lineTo(tipX + 38, tipY - 22); ctx.lineTo(tipX + 34, tipY + 22); ctx.closePath(); ctx.fill();
};

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
  if (canvas.toBlob) canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not export the poster image.'))), 'image/png');
  else reject(new Error('This browser cannot export images.'));
});

/**
 * Build one personalized poster: the fight's original Fight Registry poster,
 * unchanged, with the FANTASY MMADNESS promotional overlay added around it.
 * Returns { blob, dataUrl, width, height, format, url, cta, art, untouched }:
 * `art` is where the original poster sits and `untouched` the part of it that
 * is drawn with no blending at all (everything except the soft outer fade).
 */
export async function buildAffiliateFightPoster({
  format = 'feed', url, affiliate, artUrl, loadImage = defaultLoadImage, qrCrown = true,
}) {
  const spec = POSTER_FORMATS[format];
  if (!spec) throw new Error('Unknown poster format.');
  if (!url || !/^https:\/\//i.test(url)) throw new Error('This affiliate does not have a tracked fight link yet.');
  if (!artUrl) throw new Error('This fight has no poster in the Fight Registry yet. Upload the fight poster first.');

  // M-level error correction keeps the code small (large modules) so it scans
  // from a phone; 2-module quiet zone plus the white card margin.
  const qrDataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, scale: 1, color: { dark: '#000000', light: '#ffffff' } });
  await loadFonts();
  const [art, qr, brand, crown] = await Promise.all([
    loadImage(artUrl), loadImage(qrDataUrl), loadImage(KIT.brand), loadImage(KIT.crown),
  ]);
  if (!qr) throw new Error('Could not create the QR code.');
  if (!art) throw new Error('Could not load this fight\'s poster from the Fight Registry.');

  const plan = planOverlay(format, art.width, art.height);
  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  drawExtension(ctx, spec, art, plan);
  // The original poster: whole, proportional, nothing drawn over it.
  const untouched = drawBlendedPoster(ctx, spec, art, plan.art);
  if (brand) ctx.drawImage(brand, plan.brand.x, plan.brand.y, plan.brand.w, plan.brand.h);
  const cta = posterCallToAction(affiliate);
  drawPromoRow(ctx, spec, plan.row, { qr, crown: qrCrown ? crown : null, cta });

  const blob = await canvasToBlob(canvas);
  return { blob, dataUrl: canvas.toDataURL('image/png'), width: spec.width, height: spec.height, format, url, cta: cta.text, art: plan.art, untouched };
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
