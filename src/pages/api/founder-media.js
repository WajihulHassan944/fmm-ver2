import { list } from '@vercel/blob';
const SLOTS = ['hero','career','championship','gyms','legends','vision','mission','ring'];
export default async function handler(req,res) {
  if(req.method!=='GET') return res.status(405).json({message:'Method not allowed'});
  res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=60');
  if(!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) return res.status(200).json({slots:{},configured:false});
  try {
    const slots={};
    let cursor;
    do {
      const result=await list({prefix:'founder-media/',limit:1000,cursor,storeId:process.env.BLOB_STORE_ID});
      for(const blob of result.blobs) {
        const slot=blob.pathname.split('/')[1];
        if(!SLOTS.includes(slot)) continue;
        if(!slots[slot] || new Date(blob.uploadedAt)>new Date(slots[slot].uploadedAt)) slots[slot]={url:blob.url,pathname:blob.pathname,uploadedAt:blob.uploadedAt};
      }
      cursor=result.hasMore?result.cursor:undefined;
    } while(cursor);
    return res.status(200).json({slots,configured:true});
  } catch(e) { return res.status(503).json({message:'Founder media storage unavailable.'}); }
}
