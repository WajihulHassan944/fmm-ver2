import QRCode from 'qrcode';

// Public QR image for an affiliate's specific fight. Only build our own
// fight URLs; never accept an arbitrary URL as a QR generator input.
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  const { fightId, affiliateId } = req.query;
  if (!/^[a-f\d]{24}$/i.test(String(fightId || '')) || !/^[a-f\d]{24}$/i.test(String(affiliateId || ''))) {
    return res.status(400).json({ message: 'A valid fight and affiliate are required.' });
  }
  try {
    const link = `https://www.fantasymmadness.com/league/${encodeURIComponent(affiliateId)}?fightId=${encodeURIComponent(fightId)}`;
    const png = await QRCode.toBuffer(link, { type: 'png', width: 900, margin: 4, errorCorrectionLevel: 'M' });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Disposition', `${req.query.inline === '1' ? 'inline' : 'attachment'}; filename="fantasy-mmadness-fight-${fightId}.png"`);
    return res.status(200).send(png);
  } catch (error) {
    console.error('Fight QR generation failed:', error);
    return res.status(500).json({ message: 'Could not generate the fight QR.' });
  }
}
