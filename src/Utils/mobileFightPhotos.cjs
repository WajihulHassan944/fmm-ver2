// Display-only checks. Never replace a named fighter with stock artwork.
const cache = new Map();
const queue = [];
let active = 0;
const scheduleImageCheck = (task) => new Promise((resolve) => {
  const run = () => {
    active++;
    task().then(resolve, () => resolve(false)).finally(() => {
      active--;
      queue.shift()?.();
    });
  };
  if (active < 6) run();
  else queue.push(run);
});
const isImgBbUrl = (url) => /^https?:\/\/[^/]*(?:ibb\.co|imgbb\.com)\//i.test(url);
const isPhotoUrl = (value) => typeof value === 'string' && value.trim()
  && !/(?:image[-_ ]?not[-_ ]?found|photo[-_ ]?unavailable|placeholder|\/images\/(?:hero-fight|mobile-home|fmm-experience))/i.test(value);

// ImgBB can return this blue error graphic with HTTP 200, so onerror alone
// cannot distinguish it from an uploaded photo. Inspect only that provider.
const isImgBbErrorGraphic = (pixels) => {
  let blue = 0;
  let white = 0;
  const count = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b] = pixels.slice(i, i + 3);
    if (r >= 25 && r <= 45 && g >= 155 && g <= 180 && b >= 200 && b <= 230) blue++;
    if (r > 240 && g > 240 && b > 240) white++;
  }
  return count > 0 && blue / count > 0.7 && (blue + white) / count > 0.95
    && (white > 0 || blue / count > 0.98);
};

const verifyFightPhoto = (url) => {
  if (!isPhotoUrl(url) || typeof Image === 'undefined') return Promise.resolve(false);
  const previous = cache.get(url);
  if (previous && previous.expires > Date.now()) return previous.promise;
  const promise = scheduleImageCheck(() => new Promise((resolve) => {
    const image = new Image();
    const imgBb = isImgBbUrl(url);
    let settled = false;
    const finish = (valid) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      image.onload = image.onerror = null;
      resolve(valid);
    };
    const timer = setTimeout(() => finish(false), 8000);
    if (imgBb) image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (image.naturalWidth < 2 || image.naturalHeight < 2) return finish(false);
      if (imgBb) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 64;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(image, 0, 0, 64, 64);
          if (isImgBbErrorGraphic(context.getImageData(0, 0, 64, 64).data)) return finish(false);
        } catch {
          // An uninspectable ImgBB response cannot establish a fighter photo.
          return finish(false);
        }
      }
      finish(true);
    };
    image.onerror = () => finish(false);
    image.decoding = 'async';
    image.src = url;
  }));
  cache.set(url, { promise, expires: Date.now() + 60000 });
  return promise;
};

const firstVerifiedPhoto = async (sources) => {
  for (const url of [...new Set(sources.filter(isPhotoUrl))]) {
    if (await verifyFightPhoto(url)) return url;
  }
  return '';
};

const rejectFightPhoto = (url) => {
  cache.set(url, { promise: Promise.resolve(false), expires: Date.now() + 60000 });
};

module.exports = { isImgBbUrl, rejectFightPhoto, isPhotoUrl, isImgBbErrorGraphic, verifyFightPhoto, firstVerifiedPhoto };
