import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import QRCode from 'qrcode';
import { FaArrowDown, FaArrowUp, FaChartLine, FaCopy, FaPlus, FaQrcode, FaSave, FaShareAlt, FaTrash, FaTrophy } from 'react-icons/fa';
import AffiliateExperienceNav from '@/Components/Affiliates/AffiliateExperienceNav';
import { fullCardRequest, uploadFullCardImage } from '@/Utils/fullCardApi';

const PROMOTER_TOKEN_PACK_SIZE = 5000;
const PROMOTER_TOKEN_PACK_USD = 3.99;
const PROMOTER_TOKEN_USD_RATE = PROMOTER_TOKEN_PACK_USD / PROMOTER_TOKEN_PACK_SIZE;
const promoterTokensToUsd = (tokens) => ((Math.max(0, Number(tokens) || 0) * PROMOTER_TOKEN_USD_RATE).toFixed(2));
const promoterUsdToTokens = (dollars) => String(Math.max(0, Math.round((Number(dollars) || 0) / PROMOTER_TOKEN_USD_RATE)));
const selectMoneyValue = (event) => event.currentTarget.select();

const emptyBout = (index = 0) => ({ boutLabel: index === 0 ? 'MAIN EVENT' : index === 1 ? 'CO-MAIN EVENT' : `FIGHT #${index + 1}`, cardSection: 'MAIN_CARD', category: 'boxing', fighterAName: '', fighterAImage: '', fighterBName: '', fighterBImage: '', pot: 0, potUsd: '', entryTokens: 0, entryUsd: '' });
const emptyCard = { eventName: '', organizationName: '', eventPoster: '', promotionLogo: '', eventDate: '', startTime: '', venue: '', location: '', description: '', fullCardPrize: 0, fullCardPrizeUsd: '', bouts: [emptyBout(0)] };

export default function FullCardPromoterDesk() {
  const [cards, setCards] = useState([]); const [permission, setPermission] = useState(null);
  const [form, setForm] = useState(emptyCard); const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  const [qr, setQr] = useState('');
  const load = async () => { setLoading(true); setMessage(''); try { const data = await fullCardRequest('/api/affiliates/me/full-cards', { kind: 'affiliate' }); setCards(data.cards || []); setPermission(data.permission || {}); } catch (e) { setMessage(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const updateBout = (index, key, value) => setForm((old) => ({ ...old, bouts: old.bouts.map((bout, i) => {
    if (i !== index) return bout;
    if (key === 'potUsd') return { ...bout, potUsd: value, pot: promoterUsdToTokens(value) };
    if (key === 'entryUsd') return { ...bout, entryUsd: value, entryTokens: promoterUsdToTokens(value) };
    return { ...bout, [key]: value };
  }) }));
  const move = (index, delta) => setForm((old) => { const bouts = [...old.bouts]; const target = index + delta; if (target < 0 || target >= bouts.length) return old; [bouts[index], bouts[target]] = [bouts[target], bouts[index]]; return { ...old, bouts }; });
  const image = async (event, setter) => { try { setMessage('Uploading image…'); setter(await uploadFullCardImage(event.target.files?.[0])); setMessage('Image uploaded.'); } catch (e) { setMessage(e.message); } };
  const valid = useMemo(() => form.eventName && form.eventDate && form.bouts.length && form.bouts.every((b) => b.fighterAName && b.fighterBName), [form]);
  const save = async (publish = false) => {
    if (!valid) return setMessage('Add the event name, date, and both fighters for every bout.');
    setSaving(true); setMessage('');
    try {
      const { fullCardPrizeUsd, ...cardFields } = form;
      const persistedForm = {
        ...cardFields,
        bouts: form.bouts.map(({ potUsd, entryUsd, ...bout }) => bout),
      };
      const data = editingId
        ? await fullCardRequest(`/api/affiliates/me/full-cards/${editingId}`, { method: 'PUT', kind: 'affiliate', body: persistedForm })
        : await fullCardRequest('/api/affiliates/me/full-cards', { method: 'POST', kind: 'affiliate', body: persistedForm });
      const id = data.card.id; setEditingId(id);
      if (publish) await fullCardRequest(`/api/affiliates/me/full-cards/${id}/publish`, { method: 'POST', kind: 'affiliate' });
      setMessage(publish ? 'Full Card published. One link is ready to share.' : 'Draft saved.'); await load();
    } catch (e) { setMessage(e.message); } finally { setSaving(false); }
  };
  const edit = (card) => {
    setEditingId(card.id);
    setForm({
      ...emptyCard,
      ...card,
      fullCardPrizeUsd: promoterTokensToUsd(card.fullCardPrize),
      eventDate: String(card.eventDate || '').slice(0, 10),
      bouts: card.bouts?.length ? card.bouts.map((bout) => ({
        ...bout,
        potUsd: promoterTokensToUsd(bout.pot),
        entryUsd: promoterTokensToUsd(bout.entryTokens),
      })) : [emptyBout(0)],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const showQr = async (url) => { setQr(await QRCode.toDataURL(url, { width: 320, margin: 2, color: { dark: '#07101aff', light: '#ffffffff' } })); };

  return <div className="full-card-shell">
    <Head><title>Full Card Promotions | FANTASY MMADNESS</title></Head><AffiliateExperienceNav />
    <main className="full-card-container">
      <header className="full-card-hero"><p>VERIFIED PROMOTER OPERATIONS</p><h1>Full Card Promotions</h1><span>You build the fight card. FANTASY MMADNESS makes the entire card interactive.</span></header>
      {message && <div className="full-card-notice">{message}</div>}
      {!loading && !permission && <section className="full-card-locked"><h2>Promoter access</h2><p>Full Card tools are available to approved FANTASY MMADNESS promoters through a private invitation.</p></section>}
      {permission && <>
        <section className="full-card-builder">
          <header><b>01</b><div><p>EVENT DETAILS</p><h2>{editingId ? 'Edit Full Card' : 'Create Full Card'}</h2></div><button type="button" onClick={() => { setEditingId(''); setForm(emptyCard); }}>New card</button></header>
          <div className="full-card-fields">
            <label>Event name<input value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} /></label>
            <label>Promotion / organization<input value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} /></label>
            <label>Event date<input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></label>
            <label>Start time<input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></label>
            <label>Venue<input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></label>
            <label>City / location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label className="full-card-upload-field">
              <strong>Event Poster Upload</strong>
              <span>Upload the main event artwork users will see on the full-card page.</span>
              <input type="file" accept="image/*" onChange={(e) => image(e, (value) => setForm((f) => ({ ...f, eventPoster: value })))} />
              <b>{form.eventPoster ? 'Change event poster' : 'Choose event poster'}</b>
              {form.eventPoster && <img src={form.eventPoster} alt="Event poster preview" />}
            </label>
            <label className="full-card-upload-field">
              <strong>Promotional Logo Upload</strong>
              <span>Upload the promoter, organization, gym, or event logo.</span>
              <input type="file" accept="image/*" onChange={(e) => image(e, (value) => setForm((f) => ({ ...f, promotionLogo: value })))} />
              <b>{form.promotionLogo ? 'Change promotional logo' : 'Choose promotional logo'}</b>
              {form.promotionLogo && <img src={form.promotionLogo} alt="Promotion logo preview" />}
            </label>
            <label className="is-wide">Event description<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            {permission.canOfferFullCardPrize && <label>Optional Full Card grand prize ($)<input type="number" min="0" step="0.01" placeholder="0.00" value={form.fullCardPrizeUsd} onFocus={selectMoneyValue} onChange={(e) => setForm({ ...form, fullCardPrizeUsd: e.target.value, fullCardPrize: promoterUsdToTokens(e.target.value) })} /><small>{Number(form.fullCardPrize || 0).toLocaleString()} FM tokens shown publicly</small></label>}
          </div>
        </section>
        <section className="full-card-builder"><header><b>02</b><div><p>CARD ORDER</p><h2>Add Fighters & Pots</h2><span>Upload each fighter, choose the sport, and set that fight’s individual pot.</span></div><button type="button" onClick={() => setForm((f) => ({ ...f, bouts: [...f.bouts, emptyBout(f.bouts.length)] }))}><FaPlus /> Add fight</button></header>
          <div className="full-card-bouts">{form.bouts.map((bout, index) => <article key={index} className="full-card-bout-editor">
            <div className="full-card-bout-order"><strong>{String(index + 1).padStart(2, '0')}</strong><button onClick={() => move(index, -1)} type="button" disabled={index === 0} title="Move this fight higher on the card"><FaArrowUp /><span>Move up</span></button><button onClick={() => move(index, 1)} type="button" disabled={index === form.bouts.length - 1} title="Move this fight lower on the card"><FaArrowDown /><span>Move down</span></button><button className="is-delete" onClick={() => setForm((f) => ({ ...f, bouts: f.bouts.filter((_, i) => i !== index) }))} type="button" title="Delete this fight from the card"><FaTrash /><span>Delete</span></button></div>
            <div className="full-card-bout-meta"><input value={bout.boutLabel} onChange={(e) => updateBout(index, 'boutLabel', e.target.value)} /><select value={bout.cardSection} onChange={(e) => updateBout(index, 'cardSection', e.target.value)}><option value="MAIN_CARD">Main card</option><option value="PRELIM">Prelim</option></select><select value={bout.category} onChange={(e) => updateBout(index, 'category', e.target.value)}><option value="boxing">Boxing</option><option value="mma">MMA</option><option value="Bare-knuckle">Bare Knuckle</option><option value="kickboxing">Kickboxing</option><option value="pro-wrestling">Pro Wrestling</option></select></div>
            {['A', 'B'].map((side) => <div className={`full-card-fighter is-${side.toLowerCase()}`} key={side}><span>Fighter {side}</span><div className="full-card-fighter-preview">{bout[`fighter${side}Image`] ? <img src={bout[`fighter${side}Image`]} alt={`Fighter ${side} preview`} /> : <em>Upload Fighter {side} photo</em>}</div><input placeholder={`Fighter ${side} name`} value={bout[`fighter${side}Name`]} onChange={(e) => updateBout(index, `fighter${side}Name`, e.target.value)} /><label className="full-card-fighter-upload"><input type="file" accept="image/*" onChange={(e) => image(e, (value) => updateBout(index, `fighter${side}Image`, value))} /><b>{bout[`fighter${side}Image`] ? 'Change Fighter ' + side + ' photo' : 'Upload Fighter ' + side + ' photo'}</b></label></div>)}
            <div className="full-card-bout-money"><label>Fight pot ($)<input type="number" min="0" step="0.01" placeholder="0.00" value={bout.potUsd} onFocus={selectMoneyValue} onChange={(e) => updateBout(index, 'potUsd', e.target.value)} /><small>{Number(bout.pot || 0).toLocaleString()} FM tokens</small></label><label>Player entry ($)<input type="number" min="0" step="0.01" placeholder="0.00" value={bout.entryUsd} onFocus={selectMoneyValue} onChange={(e) => updateBout(index, 'entryUsd', e.target.value)} /><small>{Number(bout.entryTokens || 0).toLocaleString()} FM tokens</small></label></div>
          </article>)}</div>
        </section>
        <div className="full-card-publish-bar"><div><strong>Scoring</strong><span>We handle the scoring. You build the fight card.</span></div><button disabled={saving} onClick={() => save(false)}><FaSave /> Save draft</button><button disabled={saving} className="is-primary" onClick={() => save(true)}>Publish Full Card</button></div>
        <section className="full-card-library"><header><p>MY FIGHT CARDS</p><h2>Manage & Share</h2></header><div className="full-card-grid">{cards.map((card) => <article key={card.id}><span>{card.status}</span>{card.eventPoster && <img src={card.eventPoster} alt="" />}<h3>{card.eventName}</h3><p>{card.bouts?.length || 0} fights · {new Date(card.eventDate).toLocaleDateString()}</p><div><button onClick={() => edit(card)}>Edit</button>{card.shareUrl && <><button onClick={() => navigator.clipboard.writeText(card.shareUrl)}><FaCopy /> Link</button><button onClick={() => showQr(card.shareUrl)}><FaQrcode /> QR</button><Link href={`/card/${card.slug}/${card.promoterCode}`}><FaShareAlt /> Open</Link></>}</div></article>)}</div></section>
      </>}
      {qr && <div className="full-card-qr-modal" onClick={() => setQr('')}><div onClick={(e) => e.stopPropagation()}><h2>Full Card QR Code</h2><img src={qr} alt="Full Card QR code" /><button onClick={() => setQr('')}>Close</button></div></div>}
    </main>
  </div>;
}
