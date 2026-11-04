'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {socialBridgeEnv,createSocialSessionBridge}=require('../src/server/growthSocialSessionBridge.cjs');
const {privateKey}=crypto.generateKeyPairSync('ed25519');
const site='https://fmm-ver2-fixture.vercel.app',engine='https://fantasymmadness-growth-fixture.vercel.app';
const env={VERCEL_ENV:'preview',GROWTH_SOCIAL_ENGINE_ORIGIN:engine,GROWTH_SOCIAL_ADMIN_SITE_ORIGIN:site,GROWTH_SOCIAL_SSO_PRIVATE_KEY:privateKey.export({type:'pkcs8',format:'pem'}),JWT_SECRET_ADMIN:'unrelated-preview-key'};
test('social bridge is Preview-only and never falls back to production signing key',()=>{
 assert.equal(socialBridgeEnv({...env,VERCEL_ENV:'production'}),null);
 assert.equal(socialBridgeEnv({...env,GROWTH_SOCIAL_ENGINE_ORIGIN:'https://fantasymmadness.com'}),null);
 assert.equal(socialBridgeEnv({...env,GROWTH_SOCIAL_ADMIN_SITE_ORIGIN:site+'/other'}),null);
 assert.equal(socialBridgeEnv(env).JWT_SECRET_ADMIN,'');
 assert.equal(createSocialSessionBridge({...env,GROWTH_SOCIAL_SSO_PRIVATE_KEY:'',GROWTH_SSO_SITE_PRIVATE_KEY:env.GROWTH_SOCIAL_SSO_PRIVATE_KEY}).config.enabled,false);
});
test('existing website administrator is checked at live authority before a staging assertion; invalid and expired sessions fail',async()=>{
 const now=Math.floor(Date.now()/1000);const token=p=>Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url')+'.'+Buffer.from(JSON.stringify(p)).toString('base64url')+'.fixture-signature';
 const claims={id:'0123456789abcdef01234567',email:'fixture@example.test',iat:now,exp:now+3600};let authority=404,calls=[];
 const bridge=createSocialSessionBridge(env,{fetchImpl:async(url,opts)=>{calls.push({url,opts});if(url.startsWith('https://fantasymmadness-game-server-three-taupe.vercel.app/'))return {status:authority,json:async()=>({message:'Fight not found.'})};return {status:200,json:async()=>({ok:true,token:'preview-only-session-token',expiresAt:Date.now()+120000})};}});
 const req=p=>({method:'POST',selfOrigin:site,headers:{origin:site,'content-type':'application/json','sec-fetch-site':'same-origin',authorization:'Bearer '+token(p)},ip:'127.0.0.1'});
 assert.equal((await bridge.handle(req(claims))).status,200);assert.equal(calls.length,2);
 assert.ok(calls[0].opts.headers.Authorization);assert.equal(calls[1].opts.headers.Authorization,undefined);assert.ok(!calls[1].opts.body.includes('fixture-signature'));
 authority=401;assert.equal((await bridge.handle(req(claims))).status,401);
 calls=[];assert.equal((await bridge.handle(req({...claims,exp:now-1}))).status,401);assert.equal(calls.length,0);
 assert.equal((await bridge.handle({...req(claims),headers:{...req(claims).headers,origin:'https://evil.test'}})).status,403);
});
