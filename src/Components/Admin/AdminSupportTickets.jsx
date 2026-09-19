import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaEnvelope, FaRedo, FaSearch, FaTicketAlt } from 'react-icons/fa';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { adminHeaders, adminJsonHeaders } from '@/Utils/authFetch';

const FILTERS = ['open', 'in_progress', 'resolved', 'closed', 'all'];
const label = (value) => String(value || '').replace(/_/g, ' ');
const stamp = (value) => value ? new Date(value).toLocaleString() : '—';

export default function AdminSupportTickets() {
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedId, setSelectedId] = useState('');
  const [reply, setReply] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const selected = useMemo(() => tickets.find((ticket) => ticket._id === selectedId) || tickets[0] || null, [tickets, selectedId]);

  const load = useCallback(async () => {
    setBusy(true);
    setNotice('');
    try {
      const params = new URLSearchParams({ status: filter });
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(buildPublicApiUrl(`/api/admin/support/tickets?${params}`), { headers: adminHeaders() });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Support tickets could not be loaded.');
      setTickets(payload.tickets || []);
      setSummary(payload.summary || {});
      setSelectedId((current) => (payload.tickets || []).some((item) => item._id === current) ? current : (payload.tickets?.[0]?._id || ''));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setAssignedTo(selected?.assignedTo || ''); setReply(''); }, [selected?._id]);

  const updateTicket = async (changes, successMessage) => {
    if (!selected) return;
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch(buildPublicApiUrl(`/api/admin/support/tickets/${selected._id}`), {
        method: 'PATCH', headers: adminJsonHeaders(), body: JSON.stringify(changes),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Ticket could not be updated.');
      setReply('');
      setNotice(successMessage || `${payload.ticketNumber} updated.`);
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="support-desk">
      <div className="support-toolbar">
        <div><FaTicketAlt /><span><strong>{summary.open || 0}</strong> open</span><span><strong>{summary.in_progress || 0}</strong> working</span><span><strong>{summary.resolved || 0}</strong> resolved</span></div>
        <button type="button" onClick={load} disabled={busy}><FaRedo /> Refresh</button>
      </div>
      <div className="support-filters">
        <div>{FILTERS.map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{label(item)} <small>{summary[item] || 0}</small></button>)}</div>
        <form onSubmit={(event) => { event.preventDefault(); load(); }}><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ticket, name, email or subject" /></form>
      </div>
      {notice ? <p className="support-notice">{notice}</p> : null}
      <div className="support-grid">
        <div className="ticket-list">
          {!tickets.length && !busy ? <p className="empty">No tickets in this queue.</p> : null}
          {tickets.map((ticket) => (
            <button type="button" key={ticket._id} className={selected?._id === ticket._id ? 'selected' : ''} onClick={() => setSelectedId(ticket._id)}>
              <span><b>{ticket.ticketNumber}</b><em className={`priority ${ticket.priority}`}>{ticket.priority}</em></span>
              <strong>{ticket.subject}</strong><small>{ticket.name || 'Guest'} · {ticket.email}</small><time>{stamp(ticket.createdAt)}</time>
            </button>
          ))}
        </div>
        <div className="ticket-detail">
          {selected ? <>
            <header><div><p>{selected.ticketNumber}</p><h2>{selected.subject}</h2><span>{selected.name || 'Guest'} · <a href={`mailto:${selected.email}`}>{selected.email}</a></span></div><span className={`status ${selected.status}`}>{label(selected.status)}</span></header>
            <div className="ticket-meta"><span>Category <b>{label(selected.category)}</b></span><span>Priority <b>{selected.priority}</b></span><span>Created <b>{stamp(selected.createdAt)}</b></span><span>Assigned <b>{selected.assignedTo || 'Unassigned'}</b></span></div>
            <article><p>{selected.message}</p></article>
            {(selected.responses || []).map((response, index) => <article className="response" key={`${response.createdAt}-${index}`}><small>Support reply · {stamp(response.createdAt)}</small><p>{response.body}</p></article>)}
            <div className="ticket-controls">
              <label>Assign to<input value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="Staff name or email" /></label>
              <button type="button" onClick={() => updateTicket({ assignedTo }, 'Assignment saved.')} disabled={busy}>Save assignment</button>
              <label>Priority<select value={selected.priority} onChange={(event) => updateTicket({ priority: event.target.value })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label>
              <label>Status<select value={selected.status} onChange={(event) => updateTicket({ status: event.target.value })}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label>
            </div>
            <div className="ticket-reply"><label>Reply to customer<textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={5} placeholder="Write the email reply…" /></label><button type="button" onClick={() => updateTicket({ reply, status: 'in_progress' }, 'Reply emailed to the customer.')} disabled={busy || !reply.trim()}><FaEnvelope /> Send reply</button></div>
          </> : <p className="empty">Select a support ticket.</p>}
        </div>
      </div>
      <style jsx>{`
        .support-desk{color:#f7f8fb}.support-toolbar,.support-filters{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:15px;background:#0a0e16}.support-toolbar>div,.support-filters>div{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.support-toolbar span{padding:6px 10px;border-radius:9px;background:rgba(255,255,255,.06)}button{border:1px solid rgba(255,255,255,.13);border-radius:9px;background:#151b27;color:#fff;padding:9px 12px;cursor:pointer;font-weight:800;text-transform:capitalize}button:disabled{opacity:.55}.support-filters button.active{border-color:#f2b544;background:#f2b544;color:#211500}.support-filters small{opacity:.7}.support-filters form{display:flex;align-items:center;gap:8px;min-width:270px;padding:0 11px;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:#05070c}.support-filters input{width:100%;padding:11px 0;border:0;outline:0;background:transparent;color:#fff}.support-notice{padding:11px;border-radius:10px;background:#332b11;color:#ffdb68}.support-grid{display:grid;grid-template-columns:minmax(280px,36%) 1fr;gap:14px}.ticket-list,.ticket-detail{min-height:520px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:#080b12;overflow:hidden}.ticket-list{max-height:720px;overflow:auto}.ticket-list>button{display:grid;width:100%;gap:5px;padding:14px;text-align:left;border:0;border-bottom:1px solid rgba(255,255,255,.08);border-radius:0;background:transparent}.ticket-list>button.selected{background:rgba(242,181,68,.12);box-shadow:inset 3px 0 #f2b544}.ticket-list span{display:flex;justify-content:space-between}.ticket-list strong{font-size:.96rem}.ticket-list small,.ticket-list time{color:#929bac;font-size:.76rem}.priority{padding:2px 7px;border-radius:999px;background:#283141;font-size:.65rem}.priority.high{background:#8e171d}.ticket-detail{padding:20px}.ticket-detail header{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:15px}.ticket-detail header p{margin:0;color:#f2b544;font-weight:900}.ticket-detail h2{margin:4px 0}.ticket-detail a{color:#71a7ff}.status{height:max-content;padding:6px 10px;border-radius:999px;background:#273043;text-transform:capitalize}.status.open{background:#8e171d}.status.in_progress{background:#815d0b}.status.resolved{background:#12613f}.ticket-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.ticket-meta span{display:grid;padding:9px;border-radius:9px;background:rgba(255,255,255,.05);font-size:.75rem;color:#949dad}.ticket-meta b{color:#fff;text-transform:capitalize}.ticket-detail article{padding:14px;border-radius:11px;background:#111722;white-space:pre-wrap}.ticket-detail article.response{margin-left:32px;background:#152542}.ticket-detail article small{color:#f2b544}.ticket-controls{display:grid;grid-template-columns:2fr auto 1fr 1fr;gap:9px;margin-top:14px;align-items:end}.ticket-controls label,.ticket-reply label{display:grid;gap:5px;color:#aeb6c5;font-size:.78rem}.ticket-controls input,.ticket-controls select,.ticket-reply textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.14);border-radius:9px;background:#04070c;color:#fff;padding:10px}.ticket-reply{display:grid;gap:9px;margin-top:14px}.ticket-reply button{justify-self:end;background:#c81c24}.empty{padding:30px;text-align:center;color:#8e97a8}@media(max-width:900px){.support-grid{grid-template-columns:1fr}.ticket-list{min-height:auto;max-height:300px}.ticket-controls,.ticket-meta{grid-template-columns:1fr 1fr}.support-filters{align-items:stretch;flex-direction:column}.support-filters form{min-width:0}}
      `}</style>
    </section>
  );
}
