import { handleUpload } from '@vercel/blob/client';
import { requireAdmin } from './_adminAuth';
const IMAGE_SLOTS=new Set(['hero','career','championship','gyms','legends','vision','mission']);
const MAX_PDF=25*1024*1024;
const MAX_IMAGE=10*1024*1024;
export default async function handler(req,res) {
  if(req.method!=='POST') return res.status(405).json({message:'Method not allowed'});
  if(!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({message:'Founder uploads need a Vercel Blob store. Connect Blob storage to this project first.'});
  try {
    const response=await handleUpload({
      body:req.body,
      request:req,
      onBeforeGenerateToken:async (pathname,clientPayload)=>{
        let data;
        try { data=JSON.parse(clientPayload||'{}'); } catch { throw new Error('Invalid upload request'); }
        const slot=data.slot;
        const valid=slot==='ring'||IMAGE_SLOTS.has(slot);
        if(!valid||!pathname.startsWith('founder-media/'+slot+'/')) throw new Error('Invalid founder media slot');
        const expected=slot==='ring'?'.pdf':null;
        if(expected&&!pathname.toLowerCase().endsWith(expected)) throw new Error('The Ring article must be a PDF');
        const mockReq={headers:{authorization:'Bearer '+String(data.adminToken||'')}};
        let authStatus=0;
        const mockRes={status(code){authStatus=code;return this;},json(){return this;}};
        const authenticated=await requireAdmin(mockReq,mockRes);
        if(!authenticated) throw new Error(authStatus===403?'Admin access denied':'Admin login required');
        return {
          allowedContentTypes:slot==='ring'?['application/pdf']:['image/jpeg','image/png','image/webp','image/avif'],
          maximumSizeInBytes:slot==='ring'?MAX_PDF:MAX_IMAGE,
          addRandomSuffix:true,
        };
      },
      onUploadCompleted:async()=>{},
    });
    return res.status(200).json(response);
  } catch(error) { return res.status(400).json({message:error.message||'Upload failed'}); }
}
