import { issueSignedToken, presignUrl } from '@vercel/blob';
import { requireAdmin } from './_adminAuth';
const IMAGE_SLOTS=new Set(['hero','career','championship','gyms','legends','vision','mission']);
export default async function handler(req,res) {
  if(req.method!=='POST') return res.status(405).json({message:'Method not allowed'});
  if(!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({message:'Founder storage is not connected.'});
  const token=await requireAdmin(req,res);
  if(!token)return;
  const {slot,fileName,contentType,size}=req.body||{};
  if(slot!=='ring'&&!IMAGE_SLOTS.has(slot)) return res.status(400).json({message:'Invalid section.'});
  const isPdf=slot==='ring';
  const allowed=isPdf?['application/pdf']:['image/jpeg','image/png','image/webp','image/avif'];
  const limit=isPdf?25*1024*1024:10*1024*1024;
  if(!allowed.includes(contentType)||!Number.isSafeInteger(size)||size<1||size>limit) return res.status(400).json({message:'Invalid file type or file size.'});
  const name=String(fileName||'').replace(/[^a-zA-Z0-9._-]/g,'-').slice(0,100);
  if(!name||!name.includes('.')||(isPdf&&!name.toLowerCase().endsWith('.pdf'))) return res.status(400).json({message:'Invalid filename.'});
  const pathname='founder-media/'+slot+'/'+Date.now()+'-'+name;
  try {
    const signedToken=await issueSignedToken({operations:['put'],pathname,allowedContentTypes:allowed,maximumSizeInBytes:limit,validUntil:Date.now()+15*60*1000});
    const {presignedUrl}=await presignUrl(signedToken,{pathname,operation:'put',access:'public',validUntil:Date.now()+15*60*1000,allowedContentTypes:allowed,maximumSizeInBytes:limit});
    return res.status(200).json({presignedUrl,pathname});
  } catch(e){return res.status(502).json({message:'Could not authorize storage upload. '+(e.message||'')});}
}
