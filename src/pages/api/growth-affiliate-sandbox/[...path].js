import {affiliateAcceptanceConfig} from '@/server/affiliateAcceptanceConfig.cjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 const cfg=affiliateAcceptanceConfig();if(!cfg)return res.status(404).json({ok:false,reason:'isolated_signup_not_enabled'});
 const path=Array.isArray(req.query.path)?req.query.path.join('/'):'';
 const allowed=req.method==='POST'&&/^(context|click|signup|verify)$/.test(path)||req.method==='GET'&&/^leagues\/[a-f\d]{24}(\/qr\.png)?$/i.test(path);
 if(!allowed)return res.status(404).json({ok:false,reason:'isolated_signup_route_not_found'});
 try{const r=await fetch(cfg.origin+'/api/growth/affiliate-sandbox/'+path,{method:req.method,redirect:'error',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json',...(req.method==='POST'?{'Content-Type':'application/json'}:{})},...(req.method==='POST'?{body:JSON.stringify(req.body||{})}:{})});
  if(path.endsWith('/qr.png')&&r.ok){const b=Buffer.from(await r.arrayBuffer());if(b.length>1024*1024||!/^image\/png/.test(r.headers.get('content-type')||''))throw Error('invalid_qr');res.setHeader('Content-Type','image/png');return res.status(200).send(b);}
  const body=await r.json();return res.status(r.status).json(body);
 }catch{return res.status(503).json({ok:false,reason:'isolated_signup_temporarily_unavailable'});}
}
export const config={api:{bodyParser:{sizeLimit:'16kb'}}};
