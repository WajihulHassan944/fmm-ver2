import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { FaChevronDown, FaEnvelope, FaLifeRing, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { userJsonHeaders } from '@/Utils/authFetch';

const QUICK_HELP = [
  {
    title: 'Creating or promoting a fight',
    answer: 'Choose an approved live fight or scored Shadow fight, enter the prize, player entry cost, date and time, review the break-even number, then publish. Your public link appears in Promoted Fights.',
  },
  {
    title: 'Creating a full fight card',
    answer: 'Open Full Cards, create the event, add each bout in order, set each fight pot and entry cost, preview the full card, then publish and share the one event link or QR code.',
  },
  {
    title: 'Scoring and fight results',
    answer: 'Official round scoring is entered from the Back Office Scoring Desk. Players can edit predictions until the fight locks; completed scoring updates results and leaderboards.',
  },
  {
    title: 'Account, payment, or technical problem',
    answer: 'Send a support message below. Include the fight name, account email, and any error shown on screen so the issue can be traced quickly.',
  },
];

export default function SupportWidget() {
  const router = useRouter();
  const user = useSelector((state) => state.auth?.user || state.user?.user || null);
  const affiliate = useSelector((state) => state.affiliateAuth?.userAffiliate || null);
  const identity = affiliate || user || {};
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    fullName: [identity.firstName, identity.lastName].filter(Boolean).join(' '),
    email: identity.email || '',
    category: 'other',
    subject: '',
    message: '',
  });

  const pageLabel = useMemo(() => {
    const path = String(router.asPath || router.pathname || '/').split('?')[0];
    if (/affiliate|promoter/i.test(path)) return 'Affiliate / fight creation';
    if (/administration/i.test(path)) return 'Back Office';
    if (/fight|score|prediction/i.test(path)) return 'Fight play or scoring';
    return 'Fantasy MMAdness app';
  }, [router.asPath, router.pathname]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch(buildPublicApiUrl('/api/support/tickets'), {
        method: 'POST',
        headers: userJsonHeaders(),
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          category: form.category,
          subject: `[${pageLabel}] ${form.subject}`,
          message: `${form.message}\n\nPage: ${router.asPath || router.pathname}`,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Support could not receive that message.');
      setForm((current) => ({ ...current, subject: '', message: '' }));
      setStatus(`Ticket ${payload.ticketNumber} created. Keep this number. Support will follow up by email.`);
    } catch (error) {
      setStatus(error.message || 'Message could not be sent. Email contact@fantasymmadness.com.');
    } finally {
      setBusy(false);
    }
  };

  if (router.pathname === '/contact') return null;

  return (
    <div className={`fmm-support-widget${open ? ' is-open' : ''}`}>
      {open ? (
        <section className="fmm-support-panel" role="dialog" aria-modal="false" aria-label="Fantasy MMAdness Help and Support">
          <header>
            <div><FaLifeRing /><span><small>Fantasy MMAdness</small><strong>Help &amp; Support</strong></span></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close support"><FaTimes /></button>
          </header>
          <div className="fmm-support-body">
            <p className="fmm-support-context">Help for: <strong>{pageLabel}</strong></p>
            <div className="fmm-support-answers">
              {QUICK_HELP.map((item, index) => (
                <button type="button" key={item.title} className={expanded === index ? 'is-expanded' : ''} onClick={() => setExpanded(expanded === index ? -1 : index)}>
                  <span>{item.title}<FaChevronDown /></span>
                  {expanded === index ? <em>{item.answer}</em> : null}
                </button>
              ))}
            </div>
            <div className="fmm-support-divider"><span>Still need help? Ask support</span></div>
            <form onSubmit={submit}>
              <div className="fmm-support-pair">
                <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Your name" aria-label="Your name" required />
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email" aria-label="Email address" required />
              </div>
              <select value={form.category} onChange={(e) => update('category', e.target.value)} aria-label="Support category">
                <option value="other">General question</option>
                <option value="account">Account or login</option>
                <option value="payment">Payment or prize</option>
                <option value="scoring">Scoring or prediction</option>
                <option value="affiliate">Affiliate or fight promotion</option>
              </select>
              <input value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="What do you need help with?" aria-label="Support subject" required />
              <textarea value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Ask your question or describe what happened…" aria-label="Support message" rows={4} required />
              <button className="fmm-support-send" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send to Support'} <FaPaperPlane /></button>
              {status ? <p className="fmm-support-status">{status}</p> : null}
              <a href="mailto:contact@fantasymmadness.com"><FaEnvelope /> contact@fantasymmadness.com</a>
            </form>
          </div>
        </section>
      ) : null}
      <button className="fmm-support-launcher" type="button" onClick={() => setOpen((value) => !value)} aria-label="Open Help and Support">
        <FaLifeRing /><span>Help &amp; Support</span>
      </button>
      <style jsx global>{`
        .fmm-support-widget { position: fixed; right: 18px; bottom: 18px; z-index: 2147483000; font-family: Rajdhani, Arial, sans-serif; }
        .fmm-support-launcher { min-height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 18px; border: 1px solid rgba(255,207,69,.7); border-radius: 999px; background: linear-gradient(135deg,#f2b544,#ffda64); color: #241600; box-shadow: 0 16px 42px rgba(0,0,0,.42); font-weight: 900; cursor: pointer; }
        .fmm-support-launcher svg { font-size: 1.15rem; }
        .fmm-support-panel { position: absolute; right: 0; bottom: 64px; width: min(410px, calc(100vw - 24px)); max-height: min(720px, calc(100vh - 96px)); overflow: auto; border: 1px solid rgba(255,255,255,.16); border-radius: 22px; background: #080b12; color: #fff; box-shadow: 0 28px 80px rgba(0,0,0,.68); }
        .fmm-support-panel header { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; padding: 17px 18px; background: linear-gradient(135deg,#9f1116,#d61f25 55%,#173f9b); border-bottom: 1px solid rgba(255,255,255,.14); }
        .fmm-support-panel header > div { display: flex; align-items: center; gap: 11px; }
        .fmm-support-panel header svg { color: #ffdc68; font-size: 1.35rem; }
        .fmm-support-panel header span { display: grid; }
        .fmm-support-panel header small { font-size: .66rem; letter-spacing: .12em; text-transform: uppercase; opacity: .74; }
        .fmm-support-panel header strong { font-size: 1.15rem; text-transform: uppercase; }
        .fmm-support-panel header button { width: 34px; height: 34px; border: 1px solid rgba(255,255,255,.2); border-radius: 50%; background: rgba(0,0,0,.24); color: #fff; cursor: pointer; }
        .fmm-support-body { padding: 17px; }
        .fmm-support-context { margin: 0 0 12px; color: rgba(255,255,255,.68); font-size: .82rem; }
        .fmm-support-context strong { color: #ffcf45; }
        .fmm-support-answers { display: grid; gap: 7px; }
        .fmm-support-answers button { width: 100%; padding: 12px 13px; text-align: left; border: 1px solid rgba(255,255,255,.11); border-radius: 12px; background: rgba(255,255,255,.045); color: #fff; cursor: pointer; }
        .fmm-support-answers button > span { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-weight: 800; }
        .fmm-support-answers button svg { color: #ffcf45; transition: transform .2s ease; }
        .fmm-support-answers button.is-expanded svg { transform: rotate(180deg); }
        .fmm-support-answers em { display: block; margin-top: 9px; color: rgba(255,255,255,.68); font-style: normal; font-size: .82rem; line-height: 1.48; }
        .fmm-support-divider { display: flex; align-items: center; margin: 17px 0 12px; color: #ffcf45; font-size: .72rem; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
        .fmm-support-divider:before,.fmm-support-divider:after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,.12); }
        .fmm-support-divider span { padding: 0 9px; }
        .fmm-support-panel form { display: grid; gap: 8px; }
        .fmm-support-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .fmm-support-panel input,.fmm-support-panel textarea,.fmm-support-panel select { width: 100%; box-sizing: border-box; border: 1px solid rgba(255,255,255,.13); border-radius: 10px; background: #03060c; color: #fff; padding: 11px 12px; outline: none; font: inherit; }
        .fmm-support-panel textarea { resize: vertical; min-height: 92px; }
        .fmm-support-panel input:focus,.fmm-support-panel textarea:focus,.fmm-support-panel select:focus { border-color: #ffcf45; box-shadow: 0 0 0 2px rgba(255,207,69,.12); }
        .fmm-support-send { min-height: 43px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 10px; background: linear-gradient(135deg,#c9171e,#ef3037); color: #fff; font-weight: 900; cursor: pointer; }
        .fmm-support-send:disabled { opacity: .65; cursor: wait; }
        .fmm-support-status { margin: 2px 0; color: #ffdc68; font-size: .8rem; font-weight: 700; }
        .fmm-support-panel form > a { display: flex; align-items: center; justify-content: center; gap: 7px; color: rgba(255,255,255,.62); font-size: .75rem; text-decoration: none; }
        @media (max-width: 767px) {
          .fmm-support-widget { right: 12px; bottom: calc(76px + env(safe-area-inset-bottom)); }
          .fmm-support-launcher { min-width: 50px; min-height: 50px; padding: 0 15px; }
          .fmm-support-widget:not(.is-open) .fmm-support-launcher span { display: none; }
          .fmm-support-panel { bottom: 61px; max-height: calc(100vh - 160px); }
          .fmm-support-pair { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
