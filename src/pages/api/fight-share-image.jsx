import { getAffiliateFightShareUrl } from '@/Utils/affiliatePublicLink';
import React from 'react';
import { ImageResponse } from 'next/og';
import QRCode from 'qrcode';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';

const validId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const fightId = String(req.query.fightId || '');
  const affiliateId = String(req.query.affiliateId || '');
  const facebook = req.query.format === 'facebook';
  const height = facebook ? 630 : 1200;
  const qrSize = facebook ? 100 : 270;
  const qrInset = facebook ? 546 : 17;
  const artSize = facebook ? 480 : 1200;
  if (!validId(fightId) || !validId(affiliateId)) return res.status(400).end();

  try {
    const [fightResponse, affiliateResponse] = await Promise.all([
      fetch(`${PUBLIC_API_BASE_URL}/api/public/fights/${fightId}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`${PUBLIC_API_BASE_URL}/api/public/affiliates/${affiliateId}`, { signal: AbortSignal.timeout(8000) }),
    ]);
    if (affiliateResponse.status === 404 || fightResponse.status === 404) return res.status(404).end();
    if (!fightResponse.ok || !affiliateResponse.ok) return res.status(502).end();
    const [fightPayload, affiliate] = await Promise.all([fightResponse.json(), affiliateResponse.json()]);
    const fight = fightPayload.fight || fightPayload.data || fightPayload;
    if (!fight || !affiliate || String(affiliate._id) !== affiliateId || !affiliate.verified) return res.status(404).end();

    // Issue #185: an affiliate with an owner-approved personalized poster for
    // this fight gets THAT poster in her link preview; everyone else keeps the
    // general fight poster below.
    let poster = '';
    let posterSource = 'general';
    try {
      const personal = await fetch(`${PUBLIC_API_BASE_URL}/api/public/affiliate-posters/${fightId}/${affiliateId}/image?format=jpeg`, { signal: AbortSignal.timeout(8000) });
      if (personal.ok && (personal.headers.get('content-type') || '').startsWith('image/jpeg')) {
        const bytes = Buffer.from(await personal.arrayBuffer());
        if (bytes.length && bytes.length < 8_000_000) { poster = `data:image/jpeg;base64,${bytes.toString('base64')}`; posterSource = 'personalized'; }
      }
    } catch (error) { console.error('Could not load the personalized poster:', error); }

    let artUrl = poster ? '' : (fight.fightPosterImage || '');
    if (!artUrl && !poster) {
      const listResponse = await fetch(`${PUBLIC_API_BASE_URL}/api/public/prediction-fights?limit=100`, { signal: AbortSignal.timeout(8000) });
      if (listResponse.ok) {
        const list = await listResponse.json();
        const row = (list.items || list.data || []).find((item) => String(item._id || item.id) === fightId);
        artUrl = row?.fightPosterImage || row?.promotionBackground || '';
      }
    }
    if (!poster) artUrl ||= fight.promotionBackground || '';
    if (artUrl) {
      const source = new URL(artUrl);
      if (source.protocol === 'https:' && source.hostname === 'res.cloudinary.com') {
        // The OG renderer can fail on uploaded WebP posters. Ask Cloudinary for
        // JPEG so both the affiliate landing and login pages render reliably.
        const jpegUrl = source.toString().replace('/image/upload/', '/image/upload/f_jpg,q_85/');
        try {
          const image = await fetch(jpegUrl, { signal: AbortSignal.timeout(8000), redirect: 'error' });
          if (image.ok && (image.headers.get('content-type') || '').startsWith('image/jpeg') && Number(image.headers.get('content-length') || 0) < 8_000_000) {
            const bytes = Buffer.from(await image.arrayBuffer());
            if (bytes.length < 8_000_000) poster = `data:image/jpeg;base64,${bytes.toString('base64')}`;
          }
        } catch (error) { console.error('Could not load fight artwork:', error); }
      }
    }

    const link = getAffiliateFightShareUrl(affiliate, fightId);
    const qr = await QRCode.toDataURL(link, { width: 360, margin: 3, errorCorrectionLevel: 'M' });
    const render = (art) => new ImageResponse(
      <div style={{ display: 'flex', position: 'relative', width: 1200, height, justifyContent: 'center', background: '#090c17', overflow: 'hidden' }}>
        {art ? <img src={art} alt="" width={artSize} height={artSize} style={{ objectFit: 'contain', marginTop: facebook ? 15 : 0 }} /> :
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: facebook ? 35 : 90, width: 1200, height, background: 'linear-gradient(135deg,#24050a,#111a30)', color: 'white' }}>
            <div style={{ display: 'flex', color: '#ff3349', fontSize: 42, fontWeight: 800 }}>FANTASY MMADNESS</div>
            <div style={{ display: 'flex', marginTop: facebook ? 20 : 70, fontSize: facebook ? 48 : 72, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1 }}>{String(fight.matchFighterA || 'FIGHT NIGHT').slice(0, 36)}</div>
            <div style={{ display: 'flex', color: '#ffd273', fontSize: 42, fontWeight: 800, marginTop: 20 }}>VS</div>
            <div style={{ display: 'flex', fontSize: facebook ? 48 : 72, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1 }}>{String(fight.matchFighterB || '').slice(0, 36)}</div>
            <div style={{ display: 'flex', marginTop: facebook ? 20 : 70, fontSize: 32, fontWeight: 700 }}>PREDICT THE FIGHT · JOIN MY LEAGUE</div>
          </div>}
        <div style={{ display: 'flex', position: 'absolute', right: qrInset, bottom: 17, padding: 4, background: 'white' }}>
          <img src={qr} alt="Affiliate fight QR" width={qrSize} height={qrSize} />
        </div>
      </div>,
      { width: 1200, height },
    );
    res.setHeader('Content-Type', 'image/png');
    // Shorter cache for a personalized poster so a newly approved version shows up quickly.
    res.setHeader('Cache-Control', posterSource === 'personalized' ? 'public, max-age=300, s-maxage=300' : 'public, max-age=3600, s-maxage=3600');
    res.setHeader('X-Poster-Source', posterSource);
    let bytes;
    try { bytes = await render(poster).arrayBuffer(); }
    catch (error) {
      console.error('Could not render uploaded fight poster, using fight title:', error);
      res.setHeader('X-Poster-Source', 'title-fallback');
      bytes = await render('').arrayBuffer();
    }
    return res.status(200).send(Buffer.from(bytes));
  } catch (error) {
    console.error('Affiliate fight share image failed:', error);
    return res.status(502).end();
  }
}
