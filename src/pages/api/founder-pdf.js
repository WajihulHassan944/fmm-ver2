import { list } from '@vercel/blob';
export default async function handler(req,res) {
  if(req.method!=='GET')return res.status(405).end();
  const file=typeof req.query.file==='string'?req.query.file:'';
  if(!/^founder-media\/ring\/[a-zA-Z0-9._-]+\.pdf$/i.test(file))return res.status(400).end();
  try {
    const found=await list({prefix:file,limit:10,storeId:process.env.BLOB_STORE_ID});
    const blob=found.blobs.find(item=>item.pathname===file);
    if(!blob)return res.status(404).end();
    const response=await fetch(blob.url);
    if(!response.ok)return res.status(502).end();
    const bytes=Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','inline; filename="Ring-Magazine-Brothers-In-Arms.pdf"');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','public, max-age=300');
    res.setHeader('Content-Length',bytes.length);
    return res.status(200).end(bytes);
  }catch(e){return res.status(503).json({message:'Magazine PDF unavailable'});}
}
