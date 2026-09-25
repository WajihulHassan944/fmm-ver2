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

    const link = `https://www.fantasymmadness.com/fight/${fightId}?ref=${affiliateId}`;
    const qr = await QRCode.toDataURL(link, { width: 360, margin: 3, errorCorrectionLevel: 'M' });
    const league = String(affiliate.leagueName || affiliate.playerName || [affiliate.firstName, affiliate.lastName].filter(Boolean).join(' ') || 'Affiliate').trim().slice(0, 42);
    const title = `${fight.matchFighterA || 'Fight'} vs ${fight.matchFighterB || 'Fight'}`.slice(0, 70);
    const response = new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#101421', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', position: 'relative', width: 630, height: 630, background: '#090c17', overflow: 'hidden' }}>
          {poster && <img src={poster} alt="" width={630} height={630} style={{ objectFit: 'contain' }} />}
          <div style={{ display: 'flex', position: 'absolute', right: 23, bottom: 21, padding: 4, background: 'white' }}>
            <img src={qr} alt="Affiliate fight QR" width={110} height={110} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 570, padding: '55px 40px', borderLeft: '9px solid #e21e35' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', color: '#ffcb56', fontSize: 25, fontWeight: 700 }}>FANTASY MMADNESS</div>
            <div style={{ display: 'flex', fontSize: 50, fontWeight: 800, marginTop: 32, lineHeight: 1.12 }}>Join my league</div>
            <div style={{ display: 'flex', fontSize: 32, marginTop: 22, lineHeight: 1.25 }}>{title}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 29, color: '#ffcb56', fontWeight: 700 }}>{league}</div>
            <div style={{ display: 'flex', fontSize: 23, marginTop: 12 }}>Scan my QR or tap this post to join</div>
          </div>
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Affiliate fight share image failed:', error);
    return res.status(502).end();
  }
}
