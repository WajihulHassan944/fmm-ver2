import QRCode from 'qrcode';

const WIDTH = 1080;
const HEIGHT = 1350;
const LOGO = '/images/fmm-experience/fantasy-mmadness-logo.png';

const loadImage = (src) => new Promise((resolve) => {
  if (!src) return resolve(null);
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = () => resolve(null);
  image.src = src;
});

const labelForSport = (sport) => {
  const normalized = String(sport || '').toLowerCase();
  if (/bare|bkfc|knuckle/.test(normalized)) return 'BARE KNUCKLE';
  if (/kick|muay/.test(normalized)) return 'KICKBOXING';
  if (/wrestl/.test(normalized)) return 'PRO WRESTLING';
  if (/mma|ufc|mixed/.test(normalized)) return 'MMA';
  if (/box/.test(normalized)) return 'BOXING';
  return 'FIGHT NIGHT';
};

const fitText = (ctx, text, maxWidth, maxSize, minSize = 30) => {
  let size = maxSize;
  do { ctx.font = `900 ${size}px Impact, 'Arial Black', sans-serif`; size -= 2; }
  while (ctx.measureText(text).width > maxWidth && size >= minSize);
};

const nameLines = (name) => {
  const words = String(name || 'FIGHTER').trim().toUpperCase().split(/\s+/);
  if (words.length < 2) return [words[0]];
  return [words.slice(0, -1).join(' '), words[words.length - 1]];
};

const drawFighter = (ctx, image, side) => {
  const left = side === 'A';
  const x = left ? -28 : 562;
  const width = 546;
  const top = 215;
  const height = 640;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, top, width, height); ctx.clip();
  if (image) {
    // Fit the whole fighter inside the panel; never crop the head or hands.
    const scale = Math.min(width / image.width, height / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.drawImage(image, x + (width - w) / 2, top + height - h, w, h);
  } else {
    ctx.fillStyle = left ? '#13264a' : '#491820';
    ctx.fillRect(x, top, width, height);
    ctx.fillStyle = '#dce0e9'; ctx.textAlign = 'center'; ctx.font = 'bold 27px Arial';
    ctx.fillText('FIGHTER PHOTO COMING SOON', x + width / 2, top + 330, width - 40);
  }
  ctx.restore();
};

const angledGlow = (ctx, x, y, color) => {
  const glow = ctx.createRadialGradient(x, y, 15, x, y, 560);
  glow.addColorStop(0, `${color}aa`); glow.addColorStop(1, `${color}00`);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, WIDTH, HEIGHT);
};

/** Produce the same portrait social poster for owner links and affiliate links. */
export async function buildFightSocialPoster({ fighterA, fighterB, fighterAImage, fighterBImage, sport, event, date, url, prizeCoins, entryCoins }) {
  if (!url) throw new Error('A fight link is required.');
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH; canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, '#07172c'); background.addColorStop(.47, '#090b15'); background.addColorStop(1, '#3a090e');
  ctx.fillStyle = background; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  angledGlow(ctx, 155, 345, '#145cef'); angledGlow(ctx, 1020, 390, '#ec2537');
  // Arena beams and a narrow center seam make unrelated fighter cutouts feel cohesive.
  ctx.strokeStyle = '#ffffff21'; ctx.lineWidth = 2;
  for (let i = 0; i < 12; i += 1) {
    ctx.beginPath(); ctx.moveTo(i * 126 - 120, 0); ctx.lineTo(540, 660); ctx.stroke();
  }
  const [left, right, logo, qr] = await Promise.all([
    loadImage(fighterAImage), loadImage(fighterBImage), loadImage(LOGO),
    QRCode.toDataURL(url, { width: 420, margin: 3, errorCorrectionLevel: 'M' }).then(loadImage),
  ]);
  drawFighter(ctx, left, 'A'); drawFighter(ctx, right, 'B');
  const vignette = ctx.createLinearGradient(0, 470, 0, 1000);
  vignette.addColorStop(0, '#080c1700'); vignette.addColorStop(.6, '#080b1ade'); vignette.addColorStop(1, '#050810');
  ctx.fillStyle = vignette; ctx.fillRect(0, 470, WIDTH, 530);
  ctx.textAlign = 'center';
  if (logo) {
    ctx.save(); ctx.shadowColor = '#050510'; ctx.shadowBlur = 28;
    ctx.drawImage(logo, 410, 45, 260, 260); ctx.restore();
  } else {
    ctx.fillStyle = '#ffc23b'; fitText(ctx, 'FANTASY MMADNESS', 830, 72); ctx.fillText('FANTASY MMADNESS', 540, 130);
  }
  ctx.fillStyle = '#ffce59'; ctx.font = '900 31px Arial, sans-serif';
  ctx.fillText(labelForSport(sport), 540, 338);
  ctx.fillStyle = '#ffcb4e'; ctx.shadowColor = '#ff6200'; ctx.shadowBlur = 18;
  fitText(ctx, 'VS', 160, 112); ctx.fillText('VS', 540, 670); ctx.shadowBlur = 0;
  const names = [nameLines(fighterA), nameLines(fighterB)];
  names.forEach((lines, index) => {
    const x = index ? 803 : 277;
    ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#000000'; ctx.shadowBlur = 12;
    lines.forEach((line, n) => {
      fitText(ctx, line, 475, 78, 30);
      ctx.fillText(line, x, 750 + n * 74, 475);
    });
    ctx.shadowBlur = 0;
  });
  ctx.fillStyle = '#080b14e9'; ctx.fillRect(0, 879, WIDTH, 471);
  ctx.fillStyle = '#f7f9ff'; fitText(ctx, String(event || labelForSport(sport)).toUpperCase(), 950, 47);
  ctx.fillText(String(event || labelForSport(sport)).toUpperCase(), 540, 931, 950);
  ctx.fillStyle = '#ffca51'; ctx.font = 'bold 33px Arial, sans-serif';
  ctx.fillText(String(date || 'FIGHT DATE TO BE ANNOUNCED').toUpperCase(), 540, 981, 950);
  const prize = Math.max(0, Math.round(Number(prizeCoins) || 0));
  const entry = Math.max(0, Math.round(Number(entryCoins) || 0));
  if (prize) {
    ctx.fillStyle = '#ffd660'; fitText(ctx, `PRIZE: ${prize.toLocaleString()} FM COINS`, 940, 52, 27);
    ctx.fillText(`PRIZE: ${prize.toLocaleString()} FM COINS`, 540, 1045, 940);
  }
  ctx.fillStyle = '#e32239'; fitText(ctx, 'PREDICT THE FIGHT', 805, 84, 56);
  ctx.fillText('PREDICT THE FIGHT', 445, 1135, 805);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText(entry ? `ENTRY: ${entry.toLocaleString()} FM COINS  •  SCORE  •  CLIMB` : 'MAKE YOUR PICKS  •  SCORE  •  CLIMB', 440, 1183, 810);
  if (qr) {
    ctx.fillStyle = '#fff'; ctx.fillRect(882, 1054, 171, 171);
    ctx.drawImage(qr, 891, 1063, 153, 153);
  }
  ctx.fillStyle = '#fff'; ctx.font = 'bold 25px Arial, sans-serif';
  ctx.fillText('SCAN TO PLAY', 968, 1257);
  ctx.font = '900 34px Arial, sans-serif'; ctx.fillText('FANTASYMMADNESS.COM', 440, 1270, 810);
  return canvas.toDataURL('image/png');
}

export function saveFightSocialPoster(image, fightId) {
  const link = document.createElement('a');
  link.href = image;
  link.download = `fantasy-mmadness-${String(fightId || 'fight').replace(/[^a-z0-9-]/gi, '')}.png`;
  document.body.appendChild(link); link.click(); link.remove();
}
