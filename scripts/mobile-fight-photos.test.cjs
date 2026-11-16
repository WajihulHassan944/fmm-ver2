const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isPhotoUrl, isImgBbErrorGraphic, firstVerifiedPhoto, verifyFightPhoto } = require('../src/Utils/mobileFightPhotos.cjs');

test('missing, generic artwork and explicit error URLs are not fighter photos', () => {
  for (const value of ['', null, '/images/hero-fight.webp', '/images/mobile-home/final-v35/sport-mma.webp', 'https://i.ibb.co/image-not-found.png']) assert.ok(!isPhotoUrl(value));
  assert.ok(isPhotoUrl('/uploads/actual-fighter.webp'));
});

test('recognizes the ImgBB HTTP-200 blue error graphic without rejecting ordinary photos', () => {
  const pixels = new Uint8ClampedArray(64 * 64 * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([37, 166, 215, 255], i);
  for (let i = 0; i < 160; i += 4) pixels.set([255, 255, 255, 255], i);
  assert.equal(isImgBbErrorGraphic(pixels), true);
  assert.equal(isImgBbErrorGraphic(new Uint8ClampedArray([80, 45, 30, 255, 255, 255, 255, 255])), false);
  assert.equal(isImgBbErrorGraphic(new Uint8ClampedArray()), false);
});

test('retries the correct fighter alternatives, rejects broken and tracking images, and shares checks', async () => {
  const requests = [];
  global.Image = class {
    set src(url) {
      requests.push(url);
      queueMicrotask(() => {
        if (url.includes('broken')) return this.onerror();
        this.naturalWidth = url.includes('tracking') ? 1 : 300;
        this.naturalHeight = 400;
        this.onload();
      });
    }
  };
  try {
    assert.equal(await firstVerifiedPhoto(['/broken.jpg', '/tracking.gif', '/valid-fighter.jpg']), '/valid-fighter.jpg');
    assert.equal(await firstVerifiedPhoto(['/broken.jpg']), '');
    assert.equal(await verifyFightPhoto('/valid-fighter.jpg'), true);
    assert.equal(requests.filter(url => url === '/valid-fighter.jpg').length, 1);
  } finally { delete global.Image; }
});

test('rejects a successful ImgBB response when its pixels are the error graphic', async () => {
  global.Image = class {
    set src(url) {
      assert.equal(this.crossOrigin, 'anonymous');
      queueMicrotask(() => { this.naturalWidth = this.naturalHeight = 300; this.onload(); });
    }
  };
  const pixels = new Uint8ClampedArray(400);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([37, 166, 215, 255], i);
  pixels.set([255, 255, 255, 255], 0);
  global.document = { createElement: () => ({ getContext: () => ({ drawImage() {}, getImageData: () => ({ data: pixels }) }) }) };
  try { assert.equal(await verifyFightPhoto('https://i.ibb.co/removed-but-http-200.png'), false); }
  finally { delete global.Image; delete global.document; }
});
