import { useEffect, useRef, useState } from 'react';

const VIDEO_URL = process.env.NEXT_PUBLIC_HOMEPAGE_COMMERCIAL_URL || '';
const SESSION_KEY = 'fmm-home-commercial-played-v2';

export default function HomepageCommercial() {
  const [show, setShow] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playbackError, setPlaybackError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!VIDEO_URL || typeof window === 'undefined') return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === '1') return;
    } catch (_) { /* storage may be restricted */ }
    setShow(true);
  }, []);

  const finish = () => {
    try { window.sessionStorage.setItem(SESSION_KEY, '1'); } catch (_) {}
    setShow(false);
  };

  useEffect(() => {
    if (!show || !videoRef.current) return;
    const video = videoRef.current;
    video.muted = true;
    const result = video.play();
    if (result && typeof result.catch === 'function') {
      result.catch(() => setPlaybackError(true));
    }
  }, [show]);

  if (!show || !VIDEO_URL) return null;

  return (
    <section aria-label="FANTASY MMADNESS introductory commercial" style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video ref={videoRef} src={VIDEO_URL} muted={muted} playsInline autoPlay preload="auto"
        onEnded={finish} onError={() => setPlaybackError(true)}
        onPlaying={() => setPlaybackError(false)}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      {playbackError && <div style={{ position: 'absolute', left: 16, bottom: 22, color: 'white', background: '#111', padding: 12, borderRadius: 8 }}>
        Playback was blocked. <button type="button" onClick={() => { setPlaybackError(false); videoRef.current?.play().catch(() => setPlaybackError(true)); }} style={{ color: 'white', background: '#bd0018', padding: '10px 14px', border: 0, borderRadius: 6, cursor: 'pointer' }}>Play Commercial</button>
      </div>}
      <div style={{ position: 'absolute', right: 16, top: 16, display: 'flex', gap: 10 }}>
        <button type="button" onClick={() => setMuted(v => !v)} style={{ background: '#151515', color: 'white', border: '1px solid #aaa', padding: '12px 16px', borderRadius: 8, cursor: 'pointer' }}>{muted ? 'Sound On' : 'Mute'}</button>
        <button type="button" onClick={finish} style={{ background: '#c40016', color: 'white', border: 0, padding: '12px 16px', borderRadius: 8, cursor: 'pointer' }}>Skip Intro</button>
      </div>
    </section>
  );
}
