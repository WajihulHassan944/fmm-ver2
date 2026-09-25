import React from 'react';
import { ImageResponse } from 'next/og';
import QRCode from 'qrcode';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';

const validId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const fightId = String(req.query.fightId || '');
  const affiliateId = String(req.query.affiliateId || '');
  if (!validId(fightId) || !validId(affiliateId)) return res.status(400).end();

  try {
    const [fightResponse, affiliatesResponse] = await Promise.all([
      fetch(`${PUBLIC_API_BASE_URL}/api/public/fights/${fightId}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`${PUBLIC_API_BASE_URL}/api/public/affiliates?limit=200`, { signal: AbortSignal.timeout(8000) }),
    ]);
    if (!fightResponse.ok || !affiliatesResponse.ok) return res.status(502).end();
    const [fightPayload, affiliates] = await Promise.all([fightResponse.json(), affiliatesResponse.json()]);
    const fight = fightPayload.fight || fightPayload.data || fightPayload;
    const affiliate = Array.isArray(affiliates) && affiliates.find((item) => String(item._id) === affiliateId && item.verified);
    if (!fight || !affiliate) return res.status(404).end();

    let artUrl = fight.fightPosterImage || '';
    if (!artUrl) {
      const listResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/public/prediction-fights?limit=100`, { signal: AbortSignal.timeout(8000) });
      if (listResponse.ok) {
        const list = await listResponse.json();
        const row = (list.items || list.data || []).find((item) => String(item._id || item.id) === fightId);
        artUrl = row?.fightPosterImage || row?.promotionBackground || '';
      }
    }
    artUrl ||= fight.promotionBackground || '';
    let poster = '';
    if (artUrl) {
      const source = new URL(artUrl);
      if (source.protocol === 'https:' && source.hostname === 'res.cloudinary.com') {
        const image = await fetch(source.toString(), { signal: AbortSignal.timeout(8000), redirect: 'error' });
        const mime = (image.headers.get('content-type') || '').split(';')[0];
        if (image.ok && ['image/png', 'image/jpeg', 'image/webp'].includes(mime) && Number(image.headers.get('content-length') || 0) < 8_000_000) {
          const bytes = Buffer.from(await image.arrayBuffer());
          if (bytes.length < 8_000_000) poster = `data:${mime};base64,${bytes.toString('base64')}`;
        }
      }
    }

    const link = `https://www.fantasymmadness.com/league/${affiliateId}?fightId=${fightId}`;
    const qr = await QRCode.toDataURL(link, { width: 360, margin: 3, errorCorrectionLevel: 'M' });
    const response = new ImageResponse(
      <div style={{ display: 'flex', position: 'relative', width: 1200, height: 1200, background: '#090c17', overflow: 'hidden' }}>
        {poster && <img src={poster} alt="" width={1200} height={1200} style={{ objectFit: 'contain' }} />}
        <div style={{ display: 'flex', position: 'absolute', right: 35, bottom: 35, padding: 6, background: 'white' }}>
          <img src={qr} alt="Affiliate fight QR" width={170} height={170} />
        </div>
      </div>,
      { width: 1200, height: 1200 },
    );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Affiliate fight share image failed:', error);
    return res.status(502).end();
  }
}
