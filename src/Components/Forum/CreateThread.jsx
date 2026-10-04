import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaCommentDots, FaPaperPlane } from 'react-icons/fa';

export default function CreateThread() {
  const [title,setTitle]=useState('');
  const [body,setBody]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState('');
  const user=useSelector((state)=>state.user);
  const router=useRouter();

  const handleSubmit=async(e)=>{
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const res=await fetch('https://fantasymmadness-game-server-three.vercel.app/threads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title.trim(),body:body.trim(),profileUrl:user?.profileUrl,author:{userId:user?._id,username:[user?.firstName,user?.lastName].filter(Boolean).join(' ')}})});
      if(!res.ok) throw new Error('Unable to publish discussion');
      setTitle(''); setBody(''); router.push('/community-forum');
    } catch(err){setError(err.message || 'Unable to publish discussion.');}
    finally{setSubmitting(false);}
  };

  return <section className="premium-community-forum"><div className="theme-container premium-community-layout"><main className="premium-community-main">
    <button type="button" className="premium-forum-back" onClick={()=>router.push('/community-forum')}><FaArrowLeft /> Back to forum</button>
    <header className="premium-community-toolbar"><div><p className="xp-eyebrow"><FaCommentDots /> FIGHT COMMUNITY</p><h2>Start a discussion</h2><p>Break down a matchup, compare predictions, or start a conversation with the FANTASY MMADNESS community.</p></div></header>
    <form onSubmit={handleSubmit} className="premium-community-search" style={{display:'grid',gap:'16px'}}>
      <label><strong>Discussion title</strong><input value={title} onChange={(e)=>setTitle(e.target.value)} required maxLength={140} placeholder="What do you want to talk about?" /></label>
      <label><strong>Post</strong><textarea value={body} onChange={(e)=>setBody(e.target.value)} required rows={8} maxLength={5000} placeholder="Share your fight breakdown or question…" style={{width:'100%'}} /></label>
      {error ? <p role="alert">{error}</p> : null}
      <button type="submit" className="theme-btn theme-btn-primary" disabled={submitting}><FaPaperPlane /> {submitting?'Publishing…':'Publish discussion'}</button>
    </form>
  </main></div></section>;
}
