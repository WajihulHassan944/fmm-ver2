import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaShoppingBag, FaTrashRestore, FaUsers } from 'react-icons/fa';
import { fetchMatches } from '../../Redux/matchSlice';
import { userHeaders } from '@/Utils/authFetch';
import { FMCoinAmount } from '@/Components/Common/FMCoin';

const API='https://fantasymmadness-game-server-three.vercel.app';

export default function TrashedFights(){
 const router=useRouter(); const dispatch=useDispatch();
 const matches=useSelector((s)=>s.matches.data)||[]; const status=useSelector((s)=>s.matches.status);
 const user=useSelector((s)=>s.user); const [removed,setRemoved]=useState([]); const [busy,setBusy]=useState(''); const [error,setError]=useState('');

 useEffect(()=>{if(status==='idle') dispatch(fetchMatches());},[status,dispatch]);
 useEffect(()=>{if(!user?._id)return; let active=true;(async()=>{try{const res=await fetch(API+'/users/removed-matches',{headers:userHeaders()});if(!res.ok)throw new Error();const data=await res.json();const row=(Array.isArray(data)?data:[]).find(x=>x.userId===user._id);if(active)setRemoved(row?.removedMatchesIds||[]);}catch{if(active)setError('Unable to load trashed fights.');}})();return()=>{active=false};},[user?._id]);
 const trashed=useMemo(()=>matches.filter(m=>removed.includes(m._id)),[matches,removed]);

 const restore=async(matchId)=>{setBusy(matchId);setError('');try{const res=await fetch(API+'/remove-match-from-my-dashboard',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user._id,matchId})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||'Unable to restore fight.');setRemoved(ids=>ids.filter(id=>id!==matchId));}catch(e){setError(e.message);}finally{setBusy('');}};

 if(!user?._id)return <main className="experience-page"><div className="theme-container player-dynamic-empty"><h2>Loading your fight center…</h2></div></main>;

 return <main className="experience-page">
  <section className="theme-container player-command-hero" style={{marginTop:'28px'}}><div className="player-command-hero-copy">
   <button type="button" className="premium-forum-back" onClick={()=>router.push('/YourFights')}><FaArrowLeft/> Your Fights</button>
   <p className="xp-eyebrow">FANTASY MMADNESS FIGHT CENTER</p><h1>Trashed Fights</h1><p>Restore any fight you removed from your dashboard. Your prediction history stays connected to your account.</p>
   <div className="player-command-hero-actions"><button type="button" onClick={()=>router.push('/checkout')}><FaShoppingBag/> Add FM COINS</button></div>
  </div><div className="player-command-hero-stats"><div><span>FM COINS</span><strong><FMCoinAmount amount={Number(user.tokens||0)} /></strong></div><div><span>TRASHED</span><strong>{trashed.length}</strong></div></div></section>
  <section className="theme-container" style={{paddingTop:'32px',paddingBottom:'60px'}}>
   {error?<p role="alert">{error}</p>:null}
   {trashed.length?<div className="user-reward-card-grid">{trashed.map(match=><article className="user-reward-card" key={match._id}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',minHeight:'190px'}}>
     <img src={match.fighterAImage||'/Assets/default-avatar.png'} alt={match.matchFighterA||'Fighter A'} style={{width:'100%',height:'190px',objectFit:'cover',borderRadius:'12px'}}/>
     <img src={match.fighterBImage||'/Assets/default-avatar.png'} alt={match.matchFighterB||'Fighter B'} style={{width:'100%',height:'190px',objectFit:'cover',borderRadius:'12px'}}/>
    </div>
    <div className="user-reward-card-copy"><p className="xp-eyebrow">{match.matchCategoryTwo||match.matchCategory||'FIGHT'}</p><h2>{match.matchFighterA} <span>vs</span> {match.matchFighterB}</h2><p><FaUsers/> {(match.userPredictions||[]).length} players</p><button type="button" className="theme-btn theme-btn-primary" disabled={busy===match._id} onClick={()=>restore(match._id)}><FaTrashRestore/> {busy===match._id?'Restoring…':'Restore to Your Fights'}</button></div>
   </article>)}</div>:<div className="player-dynamic-empty"><FaTrashRestore/><h2>Your trash is clear.</h2><p>Fights you remove from Your Fights will appear here so you can restore them later.</p></div>}
  </section>
 </main>;
}
