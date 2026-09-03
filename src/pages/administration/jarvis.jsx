import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaMicrophone, FaPaperPlane, FaRobot, FaShieldAlt, FaTrashAlt, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';

const speak = (text) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new window.SpeechSynthesisUtterance(String(text).replace(/[*_#]/g, ''));
  utterance.rate = 1.02;
  window.speechSynthesis.speak(utterance);
};

const QUICK_PROMPTS = [
  'Summarize the current fight operations state.',
  'What data-quality issues should I check before promoting a fight?',
  'Give me a safe checklist before publishing a fight campaign.',
  'What should I review in Swarm today?',
];

const starterMessage = {
  role: 'assistant',
  content: 'Jarvis online. Ask me to analyze fight operations, or to score, publish, delete, or pay something out — I will show you exactly what I am about to do and wait for your approval before anything actually runs.',
};

function JarvisWorkspace() {
  const [messages, setMessages] = useState([starterMessage]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const heard = event.results?.[0]?.[0]?.transcript || '';
      if (heard.trim()) send(heard.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setVoiceSupported(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    window.speechSynthesis?.cancel();
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (_error) { /* already started */ }
  };

  const requestHistory = useMemo(
    () => messages.filter((item, index) => index > 0 && (item.role === 'user' || item.role === 'assistant')).slice(-12),
    [messages],
  );

  const send = async (preset) => {
    const message = String(preset ?? draft).trim();
    if (!message || loading) return;

    const userMessage = { role: 'user', content: message };
    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setLoading(true);

    try {
      const token = window.localStorage.getItem('adminAuthToken') || '';
      const response = await fetch('/api/jarvis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, messages: requestHistory }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `Jarvis request failed (${response.status})`);
      const reply = payload.reply || 'No response returned.';
      setMessages((current) => [...current, {
        role: 'assistant',
        content: reply,
        proposedAction: payload.proposedAction || null,
      }]);
      if (voiceOn) speak(payload.proposedAction ? `${reply} Review the proposed action and approve or reject it.` : reply);
    } catch (error) {
      setMessages((current) => [...current, {
        role: 'assistant',
        error: true,
        content: error.message || 'Jarvis is temporarily unavailable.',
      }]);
    } finally {
      setLoading(false);
      window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 40);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const runAction = async (messageIndex, action) => {
    setActionBusyId(messageIndex);
    try {
      const token = window.localStorage.getItem('adminAuthToken') || '';
      const response = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ execute: true, action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `Action failed (${response.status})`);
      const doneMessage = `Done — ${action.label}. ${payload.result?.message || ''}`.trim();
      setMessages((current) => current.map((item, index) => (index === messageIndex
        ? { ...item, proposedAction: { ...item.proposedAction, resolved: 'done' } }
        : item)).concat([{ role: 'assistant', content: doneMessage }]));
      if (voiceOn) speak(doneMessage);
    } catch (error) {
      setMessages((current) => current.concat([{ role: 'assistant', error: true, content: error.message || 'The action failed.' }]));
    } finally {
      setActionBusyId(null);
    }
  };

  const dismissAction = (messageIndex) => {
    setMessages((current) => current.map((item, index) => (index === messageIndex
      ? { ...item, proposedAction: { ...item.proposedAction, resolved: 'rejected' } }
      : item)));
  };

  return (
    <div className="jarvis-shell">
      <section className="jarvis-status-card">
        <div className="jarvis-orb"><FaRobot /></div>
        <div className="jarvis-status-copy">
          <div className="jarvis-kicker">FANTASY MMADNESS OPERATIONS COPILOT</div>
          <h2>Jarvis</h2>
          <p>Read-only AI assistance grounded in the authenticated back-office health and Swarm dashboard snapshot.</p>
        </div>
        <div className="jarvis-safe"><FaShieldAlt /> READ ONLY</div>
        <button type="button" className="jarvis-voice-toggle" onClick={() => { setVoiceOn((v) => !v); window.speechSynthesis?.cancel(); }} aria-label="Toggle spoken replies">
          {voiceOn ? <FaVolumeUp /> : <FaVolumeMute />} {voiceOn ? 'Voice on' : 'Voice off'}
        </button>
      </section>

      <section className="jarvis-grid">
        <aside className="jarvis-side">
          <div className="jarvis-side-title">Quick actions</div>
          <div className="jarvis-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button type="button" key={prompt} disabled={loading} onClick={() => send(prompt)}>{prompt}</button>
            ))}
          </div>
          <div className="jarvis-guardrail">
            <FaShieldAlt />
            <div>
              <strong>Approval-safe</strong>
              <span>Jarvis can score, publish, delete, and pay out — but every action shows you exactly what it will do first, and only runs after you click Approve.</span>
            </div>
          </div>
          <button type="button" className="jarvis-clear" onClick={() => setMessages([starterMessage])}>
            <FaTrashAlt /> Clear conversation
          </button>
        </aside>

        <div className="jarvis-chat-card">
          <div className="jarvis-chat-head">
            <div><span className="jarvis-dot" /> Jarvis online</div>
            <span>Authenticated admin workspace</span>
          </div>
          <div className="jarvis-messages" aria-live="polite">
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`jarvis-row is-${item.role}`}>
                <div className={`jarvis-message${item.error ? ' is-error' : ''}`}>
                  <div className="jarvis-message-role">{item.role === 'assistant' ? 'JARVIS' : 'YOU'}</div>
                  <div className="jarvis-message-content">{item.content}</div>
                  {item.proposedAction && !item.proposedAction.resolved && (
                    <div className="jarvis-action-card">
                      <div className="jarvis-action-title">{item.proposedAction.label}</div>
                      <div className="jarvis-action-desc">{item.proposedAction.description}</div>
                      <div className="jarvis-action-buttons">
                        <button type="button" className="jarvis-approve" disabled={actionBusyId === index} onClick={() => runAction(index, item.proposedAction)}>
                          {actionBusyId === index ? 'Running…' : 'Approve & run'}
                        </button>
                        <button type="button" className="jarvis-reject" disabled={actionBusyId === index} onClick={() => dismissAction(index)}>Reject</button>
                      </div>
                    </div>
                  )}
                  {item.proposedAction?.resolved === 'rejected' && <div className="jarvis-action-resolved">Rejected — not run.</div>}
                  {item.proposedAction?.resolved === 'done' && <div className="jarvis-action-resolved is-done">Approved and run.</div>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="jarvis-row is-assistant">
                <div className="jarvis-message is-thinking"><div className="jarvis-message-role">JARVIS</div><div>Analyzing operations…</div></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="jarvis-composer">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask Jarvis about fights, promotions, data quality, content, SEO, affiliates or Swarm…"
              rows={3}
              maxLength={4000}
            />
            {voiceSupported && (
              <button type="button" className={`jarvis-mic${listening ? ' is-live' : ''}`} onClick={toggleListening} aria-label={listening ? 'Stop listening' : 'Speak to Jarvis'}>
                <FaMicrophone />
              </button>
            )}
            <button type="button" onClick={() => send()} disabled={loading || !draft.trim()} aria-label="Send to Jarvis">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .jarvis-shell { display: grid; gap: 18px; color: #f7f8fb; }
        .jarvis-voice-toggle { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.16); color: rgba(255,255,255,.8); border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .jarvis-mic { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 999px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.06); color: #fff; cursor: pointer; }
        .jarvis-mic.is-live { background: #ef4444; border-color: #ef4444; animation: jarvisMicPulse 1.2s ease-in-out infinite; }
        @keyframes jarvisMicPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,.5); } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } }
        .jarvis-action-card { margin-top: 10px; padding: 12px 14px; border: 1px solid rgba(242,181,68,.4); border-radius: 14px; background: rgba(242,181,68,.08); }
        .jarvis-action-title { font-size: 12.5px; font-weight: 900; color: #f2b544; letter-spacing: .04em; margin-bottom: 4px; }
        .jarvis-action-desc { font-size: 13px; color: rgba(255,255,255,.82); line-height: 1.5; margin-bottom: 10px; }
        .jarvis-action-buttons { display: flex; gap: 8px; }
        .jarvis-approve { background: #22c55e; color: #052e14; border: 0; border-radius: 999px; padding: 8px 16px; font-weight: 800; font-size: 12.5px; cursor: pointer; }
        .jarvis-approve:disabled { opacity: .6; cursor: default; }
        .jarvis-reject { background: transparent; color: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.25); border-radius: 999px; padding: 8px 16px; font-weight: 700; font-size: 12.5px; cursor: pointer; }
        .jarvis-action-resolved { margin-top: 8px; font-size: 12px; font-weight: 700; color: rgba(255,255,255,.5); }
        .jarvis-action-resolved.is-done { color: #6ee7b7; }
        .jarvis-status-card { display: flex; align-items: center; gap: 16px; padding: 20px; border: 1px solid rgba(104, 149, 255, .24); border-radius: 22px; background: radial-gradient(circle at 8% 0%, rgba(77,141,255,.2), transparent 38%), linear-gradient(145deg, rgba(19,24,38,.98), rgba(7,9,15,.98)); box-shadow: 0 22px 70px rgba(0,0,0,.28); }
        .jarvis-orb { width: 58px; height: 58px; flex: 0 0 58px; display: grid; place-items: center; border-radius: 18px; font-size: 25px; background: linear-gradient(135deg,#4d8dff,#9b5cff); box-shadow: 0 0 28px rgba(77,141,255,.38); }
        .jarvis-status-copy { min-width: 0; flex: 1; }
        .jarvis-kicker { color: #82a9ff; font-size: 11px; font-weight: 900; letter-spacing: .12em; }
        .jarvis-status-copy h2 { margin: 3px 0 4px; font-size: 29px; line-height: 1; }
        .jarvis-status-copy p { margin: 0; color: rgba(255,255,255,.62); font-size: 13px; line-height: 1.5; }
        .jarvis-safe { display: flex; align-items: center; gap: 7px; padding: 8px 11px; border: 1px solid rgba(52,211,153,.28); border-radius: 999px; color: #6ee7b7; background: rgba(16,185,129,.08); font-size: 10px; font-weight: 900; letter-spacing: .08em; white-space: nowrap; }
        .jarvis-grid { display: grid; grid-template-columns: minmax(220px, 280px) minmax(0, 1fr); gap: 18px; min-height: 610px; }
        .jarvis-side, .jarvis-chat-card { border: 1px solid rgba(255,255,255,.08); border-radius: 22px; background: rgba(8,10,17,.86); box-shadow: 0 20px 60px rgba(0,0,0,.22); }
        .jarvis-side { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .jarvis-side-title { font-size: 12px; font-weight: 900; color: rgba(255,255,255,.68); letter-spacing: .08em; text-transform: uppercase; }
        .jarvis-prompts { display: grid; gap: 8px; }
        .jarvis-prompts button { text-align: left; color: #eaf0ff; background: rgba(77,141,255,.08); border: 1px solid rgba(77,141,255,.2); border-radius: 12px; padding: 11px; font: inherit; font-size: 12px; line-height: 1.4; cursor: pointer; }
        .jarvis-prompts button:hover { background: rgba(77,141,255,.15); border-color: rgba(77,141,255,.38); }
        .jarvis-prompts button:disabled { opacity: .5; cursor: wait; }
        .jarvis-guardrail { display: flex; gap: 9px; margin-top: auto; padding: 12px; border: 1px solid rgba(242,181,68,.18); border-radius: 13px; color: #f2b544; background: rgba(242,181,68,.06); }
        .jarvis-guardrail strong, .jarvis-guardrail span { display: block; }
        .jarvis-guardrail strong { font-size: 11px; margin-bottom: 3px; }
        .jarvis-guardrail span { color: rgba(255,255,255,.5); font-size: 10px; line-height: 1.45; }
        .jarvis-clear { display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,.1); border-radius: 11px; background: transparent; color: rgba(255,255,255,.55); cursor: pointer; }
        .jarvis-chat-card { min-width: 0; display: grid; grid-template-rows: auto minmax(0,1fr) auto; overflow: hidden; }
        .jarvis-chat-head { display: flex; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.07); color: rgba(255,255,255,.48); font-size: 10px; font-weight: 800; }
        .jarvis-chat-head > div { display: flex; align-items: center; gap: 7px; color: #cfe0ff; }
        .jarvis-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 10px rgba(52,211,153,.75); }
        .jarvis-messages { overflow: auto; padding: 18px; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
        .jarvis-row { display: flex; }
        .jarvis-row.is-user { justify-content: flex-end; }
        .jarvis-message { max-width: min(760px, 88%); padding: 12px 14px; border-radius: 15px 15px 15px 5px; background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.075); }
        .is-user .jarvis-message { border-radius: 15px 15px 5px 15px; background: linear-gradient(135deg,rgba(77,141,255,.25),rgba(122,91,255,.2)); border-color: rgba(77,141,255,.27); }
        .jarvis-message.is-error { border-color: rgba(248,113,113,.35); background: rgba(239,68,68,.09); }
        .jarvis-message.is-thinking { color: rgba(255,255,255,.62); }
        .jarvis-message-role { margin-bottom: 5px; font-size: 9px; color: #82a9ff; font-weight: 900; letter-spacing: .1em; }
        .jarvis-message-content { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.58; color: rgba(255,255,255,.84); }
        .jarvis-composer { display: grid; grid-template-columns: minmax(0,1fr) 50px; align-items: end; gap: 10px; padding: 14px; border-top: 1px solid rgba(255,255,255,.07); background: rgba(4,5,9,.72); }
        .jarvis-composer textarea { width: 100%; resize: none; outline: none; border: 1px solid rgba(255,255,255,.11); border-radius: 14px; background: rgba(255,255,255,.055); color: #fff; padding: 12px 13px; font: inherit; font-size: 13px; line-height: 1.45; }
        .jarvis-composer textarea:focus { border-color: rgba(77,141,255,.52); box-shadow: 0 0 0 3px rgba(77,141,255,.08); }
        .jarvis-composer button { width: 50px; height: 48px; display: grid; place-items: center; border: 0; border-radius: 14px; color: #fff; background: linear-gradient(135deg,#4d8dff,#8b5cf6); cursor: pointer; box-shadow: 0 10px 26px rgba(77,141,255,.22); }
        .jarvis-composer button:disabled { opacity: .42; cursor: default; }
        @media (max-width: 980px) { .jarvis-grid { grid-template-columns: 1fr; } .jarvis-side { order: 2; } .jarvis-chat-card { min-height: 600px; } }
        @media (max-width: 650px) { .jarvis-status-card { align-items: flex-start; flex-wrap: wrap; } .jarvis-safe { margin-left: 74px; } .jarvis-chat-head > span { display: none; } .jarvis-message { max-width: 94%; } }
      `}</style>
    </div>
  );
}

export default function JarvisPage() {
  return (
    <AdminPrivateRoute>
      <JarvisWorkspace />
    </AdminPrivateRoute>
  );
}
