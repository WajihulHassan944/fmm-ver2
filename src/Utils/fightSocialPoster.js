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
  const x = left ? 0 : 540;
  const width = 540;
  const top = 145;
  const height = 700;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, top, width, height); ctx.clip();
  if (image) {
    // Both fighters get the same panel and scale to its full usable area.
    // Preserve the entire source image so faces and outstretched hands remain visible.
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

const arenaLight = (ctx, x, color) => {
  const beam = ctx.createLinearGradient(x, 0, 540, 790);
  beam.addColorStop(0, color);
  beam.addColorStop(1, '#00000000');
  ctx.fillStyle = beam;
  ctx.beginPath(); ctx.moveTo(x - 58, 0); ctx.lineTo(x + 58, 0);
  ctx.lineTo(540, 800); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 32;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, 30, 12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};

/** Produce the same portrait social poster for owner links and affiliate links. */
export async function buildFightSocialPoster({ fighterA, fighterB, fighterAImage, fighterBImage, sport, event, date, url }) {
  if (!url) throw new Error('A fight link is required.');
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH; canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, '#071c43'); background.addColorStop(.49, '#080b18'); background.addColorStop(1, '#420711');
  ctx.fillStyle = background; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  angledGlow(ctx, 140, 280, '#1466ff'); angledGlow(ctx, 995, 280, '#f51c38');
  for (const x of [75, 205, 360]) arenaLight(ctx, x, '#367fff45');
  for (const x of [720, 875, 1010]) arenaLight(ctx, x, '#ff344945');
  // Arena beams and vivid rings frame the two existing fighter photos.
  ctx.strokeStyle = '#ffffff26'; ctx.lineWidth = 2;
  for (let i = 0; i < 12; i += 1) {
    ctx.beginPath(); ctx.moveTo(i * 126 - 120, 0); ctx.lineTo(540, 660); ctx.stroke();
  }
  const [left, right, logo, qr] = await Promise.all([
    loadImage(fighterAImage), loadImage(fighterBImage), loadImage(LOGO),
    QRCode.toDataURL(url, { width: 420, margin: 3, errorCorrectionLevel: 'M' }).then(loadImage),
  ]);
  drawFighter(ctx, left, 'A'); drawFighter(ctx, right, 'B');
  // Colored edges distinguish the two athletes while keeping their real photos intact.
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const blueEdge = ctx.createLinearGradient(0, 0, 540, 0);
  blueEdge.addColorStop(0, '#004eee28'); blueEdge.addColorStop(1, '#004eee00');
  ctx.fillStyle = blueEdge; ctx.fillRect(0, 160, 540, 680);
  const redEdge = ctx.createLinearGradient(540, 0, 1080, 0);
  redEdge.addColorStop(0, '#f20c2700'); redEdge.addColorStop(1, '#f20c2728');
  ctx.fillStyle = redEdge; ctx.fillRect(540, 160, 540, 680); ctx.restore();
  const vignette = ctx.createLinearGradient(0, 540, 0, 940);
  vignette.addColorStop(0, '#080c1700'); vignette.addColorStop(.65, '#080b1aaa'); vignette.addColorStop(1, '#070a14');
  ctx.fillStyle = vignette; ctx.fillRect(0, 540, WIDTH, 400);
  ctx.textAlign = 'center';
  if (logo) {
    ctx.save(); ctx.shadowColor = '#050510'; ctx.shadowBlur = 28;
    ctx.drawImage(logo, 423, 25, 234, 234); ctx.restore();
  } else {
    ctx.fillStyle = '#ffc23b'; fitText(ctx, 'FANTASY MMADNESS', 830, 72); ctx.fillText('FANTASY MMADNESS', 540, 130);
  }
  ctx.fillStyle = '#ffce59'; ctx.font = '900 31px Arial, sans-serif';
  ctx.fillText(labelForSport(sport), 540, 280);
  ctx.fillStyle = '#ffcb4e'; ctx.shadowColor = '#ff6200'; ctx.shadowBlur = 18;
  fitText(ctx, 'VS', 140, 114); ctx.fillText('VS', 540, 640); ctx.shadowBlur = 0;
  const names = [nameLines(fighterA), nameLines(fighterB)];
  names.forEach((lines, index) => {
    const x = index ? 810 : 270;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = index ? '#ac0a19' : '#123daa';
    ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.shadowColor = '#000000'; ctx.shadowBlur = 18;
    lines.forEach((line, n) => {
      fitText(ctx, line, 490, 86, 30);
      ctx.strokeText(line, x, 720 + n * 77, 490);
      ctx.fillText(line, x, 720 + n * 77, 490);
    });
    ctx.shadowBlur = 0;
  });
  ctx.fillStyle = '#090b16f5'; ctx.fillRect(0, 864, WIDTH, 486);
  ctx.fillStyle = '#f7f9ff'; fitText(ctx, String(event || labelForSport(sport)).toUpperCase(), 950, 60);
  ctx.fillText(String(event || labelForSport(sport)).toUpperCase(), 540, 940, 950);
  ctx.fillStyle = '#ffca51'; ctx.font = 'bold 33px Arial, sans-serif';
  ctx.fillText(String(date || 'FIGHT DATE TO BE ANNOUNCED').toUpperCase(), 540, 997, 950);
  ctx.font = '900 81px Impact, Arial Black, sans-serif';
  const predictWidth = ctx.measureText('PREDICT').width;
  const restWidth = ctx.measureText(' THE FIGHT').width;
  const phraseScale = Math.min(1, 842 / (predictWidth + restWidth));
  ctx.save(); ctx.translate(540 - (predictWidth + restWidth) * phraseScale / 2, 1135); ctx.scale(phraseScale, 1);
  ctx.fillStyle = '#ed263b'; ctx.fillText('PREDICT', predictWidth / 2, 0);
  ctx.fillStyle = '#ffffff'; ctx.fillText(' THE FIGHT', predictWidth + restWidth / 2, 0);
  ctx.restore();
  if (qr) {
    ctx.fillStyle = '#fff'; ctx.fillRect(882, 1150, 171, 171);
    ctx.drawImage(qr, 891, 1159, 153, 153);
  }
  ctx.fillStyle = '#fff'; ctx.font = 'bold 25px Arial, sans-serif';
  ctx.fillText('SCAN TO PLAY', 968, 1338);
  ctx.font = '900 34px Arial, sans-serif'; ctx.fillText('FANTASYMMADNESS.COM', 435, 1260, 800);
  return canvas.toDataURL('image/png');
}

export function saveFightSocialPoster(image, fightId) {
  const link = document.createElement('a');
  link.href = image;
  link.download = `fantasy-mmadness-${String(fightId || 'fight').replace(/[^a-z0-9-]/gi, '')}.png`;
  document.body.appendChild(link); link.click(); link.remove();
}
