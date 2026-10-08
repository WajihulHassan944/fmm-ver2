import { useEffect, useRef, useState } from 'react';

const VIDEO_URL = process.env.NEXT_PUBLIC_HOMEPAGE_COMMERCIAL_URL || '';
const SESSION_KEY = 'fmm-home-commercial-played-v1';

export default function HomepageCommercial() {
  const [show, setShow] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);
  useEffect(() => {
    if (!VIDEO_URL || typeof window === 'undefined') return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
      window.sessionStorage.setItem(SESSION_KEY, '1');
    } catch (_) { /* private browsing can restrict storage */ }
    setShow(true);
  }, []);
  useEffect(() => {
    if (!show || !videoRef.current) return;
    videoRef.current.play().catch(() => setShow(false));
  }, [show]);
  if (!show || !VIDEO_URL) return null;
  return (
    <section aria-label="FANTASY MMADNESS introductory commercial" style={{position:'fixed',inset:0,zIndex:99999,background:'#050505',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <video ref={videoRef} src={VIDEO_URL} muted={muted} playsInline autoPlay preload="auto" onEnded={() => setShow(false)} onError={() => setShow(false)} style={{width:'100%',height:'100%',objectFit:'contain'}} />
      <div style={{position:'absolute',right:16,top:16,display:'flex',gap:10}}>
        <button type="button" onClick={() => setMuted(v => !v)} style={{background:'#151515',color:'white',border:'1px solid #aaa',padding:'12px 16px',borderRadius:8,cursor:'pointer'}}>{muted ? 'Sound On' : 'Mute'}</button>
        <button type="button" onClick={() => setShow(false)} style={{background:'#c40016',color:'white',border:0,padding:'12px 16px',borderRadius:8,cursor:'pointer'}}>Skip Intro</button>
      </div>
    </section>
  );
}
