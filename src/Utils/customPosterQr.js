import QRCode from 'qrcode';

// "Custom poster + QR" for the Fight Launch Desk.
// The owner's own poster file is drawn once at its native size and is never
// resized, cropped, filtered or redrawn. The only pixels that change are the
// square the owner picked: a white quiet-zone card holding the affiliate's QR.

const STORAGE_PREFIX = 'fmm.customPosterQr.';

/** Default QR square (fractions of the poster): bottom-right, 25% of the short side. */
export const defaultQrBox = (width, height) => {
  const size = Math.round(Math.min(width, height) * 0.25);
  const margin = Math.round(Math.min(width, height) * 0.04);
  return { x: (width - size - margin) / width, y: (height - size - margin) / height, size: size / width };
};

/** Keep the square fully inside the poster and at least 40px. */
export const clampQrBox = (box, width, height) => {
  const minSize = Math.min(40 / width, 1);
  const maxSize = Math.min(1, height / width);
  const size = Math.min(Math.max(box.size, minSize), maxSize);
  const sizeY = (size * width) / height;
  return {
    size,
    x: Math.min(Math.max(box.x, 0), 1 - size),
    y: Math.min(Math.max(box.y, 0), 1 - sizeY),
  };
};

/** True when the square is big enough to scan comfortably from a phone. */
export const qrBoxScansWell = (box, width, height) => {
  const sizePx = box.size * width;
  return sizePx >= 240 && sizePx >= Math.min(width, height) * 0.2;
};

/** Square in poster pixels. */
export const boxToPixels = (box, width, height) => {
  const size = Math.round(box.size * width);
  return { x: Math.round(box.x * width), y: Math.round(box.y * height), size };
};

export const loadSavedQrBox = (fightId, width, height) => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + fightId) || 'null');
    if (saved && saved.width === width && saved.height === height && saved.box) return clampQrBox(saved.box, width, height);
  } catch { /* storage unavailable */ }
  return null;
};

export const saveQrBox = (fightId, width, height, box) => {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + fightId, JSON.stringify({ width, height, box, savedAt: new Date().toISOString() }));
    return true;
  } catch { return false; }
};

/** Read an uploaded PNG/JPEG into an image element (stays in the browser). */
export const loadPosterFile = (file) => new Promise((resolve, reject) => {
  if (!file || !['image/png', 'image/jpeg'].includes(file.type)) { reject(new Error('Choose a PNG or JPG poster.')); return; }
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => resolve({ image, url, width: image.naturalWidth, height: image.naturalHeight, name: file.name });
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be opened as an image.')); };
  image.src = url;
});

/**
 * Draw the QR for `url` into the given square: white card, 2-module quiet
 * zone, black modules aligned to whole pixels so the code stays crisp.
 */
export const drawQrInBox = (ctx, url, { x, y, size }) => {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const count = qr.modules.size;
  const quiet = 2;
  const cells = count + quiet * 2;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#000000';
  // Whole-pixel modules (every module the same size) scan far more reliably
  // than fractional ones; leftover pixels become extra white margin.
  const module = Math.floor(size / cells);
  if (module >= 1) {
    const offsetX = x + Math.floor((size - module * cells) / 2) + quiet * module;
    const offsetY = y + Math.floor((size - module * cells) / 2) + quiet * module;
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.modules.get(row, col)) ctx.fillRect(offsetX + col * module, offsetY + row * module, module, module);
      }
    }
  } else {
    const edge = (i) => Math.round((size * i) / cells);
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (!qr.modules.get(row, col)) continue;
        const x0 = x + edge(col + quiet); const x1 = x + edge(col + quiet + 1);
        const y0 = y + edge(row + quiet); const y1 = y + edge(row + quiet + 1);
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
    }
  }
  ctx.restore();
};

const canvasToPng = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not export the poster.'))), 'image/png');
});

/** The owner's poster at full size with one affiliate's QR in the chosen square. */
export const buildCustomPosterWithQr = async ({ image, width, height, box, url }) => {
  if (!/^https:\/\//i.test(String(url || ''))) throw new Error('Missing tracked link.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);
  drawQrInBox(ctx, url, boxToPixels(box, width, height));
  return canvasToPng(canvas);
};

export const posterFileSlug = (value) => String(value || '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'poster';

export const downloadBlob = (blob, fileName) => {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 30000);
};

// Minimal ZIP (stored, no compression — PNGs are already compressed) so all
// posters can be downloaded as one file without adding a dependency.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

/** files: [{ name, bytes: Uint8Array }] → Uint8Array of a .zip */
export const makeZip = (files) => {
  const encoder = new TextEncoder();
  const parts = []; const central = []; let offset = 0;
  files.forEach(({ name, bytes }) => {
    const nameBytes = encoder.encode(name);
    const crc = crc32(bytes);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true); local.setUint16(10, 0, true); local.setUint16(12, 0x21, true);
    local.setUint32(14, crc, true); local.setUint32(18, bytes.length, true); local.setUint32(22, bytes.length, true);
    local.setUint16(26, nameBytes.length, true); local.setUint16(28, 0, true);
    parts.push(new Uint8Array(local.buffer), nameBytes, bytes);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true); entry.setUint16(4, 20, true); entry.setUint16(6, 20, true); entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 0, true); entry.setUint16(12, 0, true); entry.setUint16(14, 0x21, true);
    entry.setUint32(16, crc, true); entry.setUint32(20, bytes.length, true); entry.setUint32(24, bytes.length, true);
    entry.setUint16(28, nameBytes.length, true); entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), nameBytes);
    offset += 30 + nameBytes.length + bytes.length;
  });
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((sum, part) => sum + part.length, 0));
  let at = 0; all.forEach((part) => { out.set(part, at); at += part.length; });
  return out;
};
