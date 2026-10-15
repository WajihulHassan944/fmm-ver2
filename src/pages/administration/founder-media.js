import React,{useEffect,useState} from 'react';
import Link from 'next/link';
import { getAdminToken } from '@/Utils/authFetch';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
const SLOTS=[
  ['ring','Original Ring Magazine PDF','PDF · all six pages, original photos'],
  ['hero','Main founder portrait','Your main photograph at the top of the page'],
  ['career','Early career','Reno and Las Vegas boxing history'],
  ['championship','World championship','You and Kelvin, championship belts, Ring coverage'],
  ['gyms','Koncrete gyms','Reno, Scottsdale, Atlanta'],
  ['legends','Legends and fighters','Photos with fighters and coaches'],
  ['vision','Origin of FANTASY MMADNESS','The vision and creation story'],
  ['mission','Message to the fighters','Your final founder statement'],
];
function Editor(){
 const [slots,setSlots]=useState({}),[files,setFiles]=useState({}),[busy,setBusy]=useState(''),[message,setMessage]=useState('');
 const refresh=async()=>{try{const r=await fetch('/api/founder-media',{cache:'no-store'});const d=await r.json();if(r.ok)setSlots(d.slots||{});else setMessage(d.message||'Unable to load media');}catch{setMessage('Could not load founder media');}};
 useEffect(()=>{refresh();},[]);
 const publish=async(slot)=>{
   const file=files[slot];if(!file)return setMessage('Choose a file first.');
   if(slot==='ring'&&file.type!=='application/pdf')return setMessage('Choose a PDF for The Ring article.');
   if(slot!=='ring'&&!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))return setMessage('Choose a JPG, PNG, WEBP or AVIF photo.');
   if(file.size>(slot==='ring'?25:10)*1024*1024)return setMessage('File exceeds the upload size limit.');
   setBusy(slot);setMessage('');
   try {
     const token=getAdminToken();if(!token)throw new Error('Sign in to the back office again.');
     const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
     const signedResponse=await fetch('/api/founder-upload',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({slot,fileName:safeName,contentType:file.type,size:file.size})});
     const signedData=await signedResponse.json();
     if(!signedResponse.ok)throw new Error(signedData.message||'Could not authorize upload.');
     const result=await fetch(signedData.presignedUrl,{method:'PUT',body:file,headers:{'Content-Type':file.type}});
     if(!result.ok)throw new Error('Storage rejected the file ('+result.status+').');
     setMessage('Published '+file.name+'. The public founder page now uses the latest file in this section.');
     await refresh();
   }catch(error){setMessage('Upload failed: '+(error.message||'Please try again.'));}
   finally{setBusy('');}
 };
 return <main style={{padding:'24px',maxWidth:1080,margin:'0 auto',color:'#f6f6f6'}}>
  <p style={{color:'#ef3039',fontWeight:800,letterSpacing:2}}>FOUNDER PAGE CONTENT</p>
  <h1 style={{fontSize:36,marginBottom:8}}>Founder Media Manager</h1>
  <p>Upload your original Ring Magazine PDF and your own photographs to specific sections of the public founder page. Uploading a new file replaces the displayed file for that section; the existing file stays visible until the new upload succeeds.</p>
  <p><Link href="/founder" target="_blank" style={{color:'#ff646b'}}>Open public Founder page ↗</Link></p>
  {message&&<p role="status" style={{padding:14,border:'1px solid #a33',borderRadius:8}}>{message}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:16,marginTop:25}}>
   {SLOTS.map(([slot,title,description])=><section key={slot} style={{background:'#171717',border:'1px solid #444',padding:20,borderRadius:14}}>
    <h2 style={{fontSize:20,margin:'0 0 8px'}}>{title}</h2><p style={{fontSize:14,opacity:.8}}>{description}</p>
    {slots[slot]&&(slot==='ring'?<a href={slots[slot].url} target="_blank" rel="noopener noreferrer" style={{color:'#ff646b'}}>View current PDF ↗</a>:<img src={slots[slot].url} alt={title} style={{width:'100%',maxHeight:180,objectFit:'contain',marginBottom:12}}/>)}
    <label style={{display:'block',marginTop:15,fontWeight:700}}>Choose {slot==='ring'?'PDF':'photograph'}</label>
    <input type="file" accept={slot==='ring'?'.pdf,application/pdf':'image/jpeg,image/png,image/webp,image/avif'} onChange={e=>setFiles(prev=>({...prev,[slot]:e.target.files?.[0]||null}))} style={{display:'block',width:'100%',margin:'10px 0'}}/>
    <button type="button" disabled={Boolean(busy)||!files[slot]} onClick={()=>publish(slot)} style={{background:'#cf101b',color:'white',border:0,borderRadius:8,padding:'12px 18px',fontWeight:800,cursor:'pointer',opacity:busy?.5:1}}>{busy===slot?'UPLOADING…':'UPLOAD & PUBLISH'}</button>
   </section>)}
  </div>
 </main>;
}
export default function FounderMediaAdmin(){return <AdminPrivateRoute><Editor/></AdminPrivateRoute>;}
