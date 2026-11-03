const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { engineLocation, trustedConsoleMessage, sameOriginSessionPath, sectionTarget } = require('../src/Utils/growthEngineEmbed.cjs');

test('only HTTPS service roots and loopback test origins are accepted', () => {
  assert.equal(engineLocation('https://engine.example').origin, 'https://engine.example');
  assert.ok(engineLocation('http://127.0.0.1:4391'));
  for (const value of ['http://engine.example', 'javascript:alert(1)', 'https://user:password@engine.example', 'https://engine.example?redirect=evil', 'https://engine.example/other', 'https://engine.example#bad']) assert.equal(engineLocation(value), null);
});
test('iframe messages must match BOTH origin and the current contentWindow', () => {
  const child = {}, message = { origin:'https://engine.example', source:child, data:{ type:'fmm-growth-console',section:'marketing' } };
  assert.equal(trustedConsoleMessage(message, message.origin, child), true);
  assert.equal(trustedConsoleMessage({...message,origin:'https://evil.example'}, message.origin, child),false);
  assert.equal(trustedConsoleMessage({...message,source:{}}, message.origin, child),false);
  assert.equal(trustedConsoleMessage({...message,data:{type:'fmm-growth-console',section:'x'.repeat(100)}},message.origin,child),false);
});
test('normal administrator credentials can only target a relative same-origin API path', () => {
  assert.equal(sameOriginSessionPath('/api/administration/growth-session'),'/api/administration/growth-session');
  for (const path of [undefined,'https://engine.example/api/session','//engine.example/api/session','/api/../../elsewhere','/api/\\evil','/api/session?redirect=evil','/api/session#token','/api/\nsession']) assert.equal(sameOriginSessionPath(path),'');
});
test('feature defaults OFF; every department maps to the existing console', () => {
  const source=fs.readFileSync(require.resolve('../src/Utils/adminFeatures.js'),'utf8').replace(/export const /g,'const ');
  const context={process:{env:{}}}; vm.createContext(context);vm.runInContext(source+';this.result={enabled:GROWTH_ENGINE_V2,sections:GROWTH_SECTIONS};',context);
  assert.equal(context.result.enabled,false);
  assert.equal(context.result.sections.length,11);
  assert.equal(sectionTarget('posters',context.result.sections),'marketing?view=posters');
  assert.equal(sectionTarget('untrusted',context.result.sections),'overview');
});
function client(path, response) {
  const storage=new Map(), calls=[];
  const source=fs.readFileSync(require.resolve('../src/Utils/growthEngineApi.js'),'utf8').replace(/^import .*;$/gm,'').replace(/\bexport (const|class|async function|function)\b/g,'$1');
  const context={ process:{env:{NEXT_PUBLIC_GROWTH_ENGINE_URL:'https://engine.example',NEXT_PUBLIC_FMM_GROWTH_SESSION_PATH:path}}, sameOriginSessionPath, getAdminToken:()=> 'test-administrator-session', URL, Event, window:{sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},dispatchEvent:()=>{}},fetch:async (url,options)=>{calls.push({url,options});return {ok:response.status===200,status:response.status,json:async()=>response.body};} };
  vm.createContext(context);vm.runInContext(source+';this.api=growthEngineApi;this.token=growthToken;',context);return {...context,calls,storage};
}
test('session exchange fails closed without an approved same-origin endpoint', async () => {
  for(const path of [undefined,'https://engine.example/admin/bridge']){const c=client(path,{});await assert.rejects(()=>c.api.exchangeAdminSession(),/not configured/);assert.equal(c.calls.length,0);}
});
test('exchange keeps administrator token same-origin and stores only the separate scoped token', async () => {
  const c=client('/api/administration/growth-session',{status:200,body:{ok:true,token:'test-growth-scoped-session',expiresAt:Date.now()+60000,engineOrigin:'https://engine.example'}});
  await c.api.exchangeAdminSession(); assert.equal(c.calls[0].url,'/api/administration/growth-session');assert.equal(c.calls[0].options.redirect,'error');
  assert.equal(c.calls[0].options.headers.Authorization,'Bearer test-administrator-session');assert.equal(c.token.get(),'test-growth-scoped-session');
  assert.equal([...c.storage.values()].includes('test-administrator-session'),false);
});
test('rejected, echoed, expired and wrong-origin sessions are not accepted', async () => {
  for(const body of [{ok:true,token:'test-administrator-session',expiresAt:Date.now()+60000,engineOrigin:'https://engine.example'},{ok:true,token:'test-growth-scoped-session',expiresAt:Date.now()-1000,engineOrigin:'https://engine.example'},{ok:true,token:'test-growth-scoped-session',expiresAt:Date.now()+60000,engineOrigin:'https://evil.example'},{ok:true,token:'',expiresAt:Date.now()+60000,engineOrigin:'https://engine.example'}]) {
    const c=client('/api/session',{status:200,body});await assert.rejects(()=>c.api.exchangeAdminSession(),/rejected/);assert.equal(c.token.get(),'');
  }
  const c=client('/api/session',{status:401,body:{reason:'expired'}});c.token.set('previous-token');await assert.rejects(()=>c.api.exchangeAdminSession());assert.equal(c.token.get(),'');
});
test('expired token and explicit logout clear the browser bridge cache', () => {
  const c=client('/api/session',{});c.token.set('expired-growth-session',Date.now()-1);assert.equal(c.token.get(),'');c.token.set('active-growth-session');c.api.logout();assert.equal(c.token.get(),'');
});
