// Preserve explicitly allowed campaign context through the legacy entry point.
const CAMPAIGN_KEYS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
function affiliateSignupDestination(query={}){
 const params=new URLSearchParams({mode:'signup',role:'affiliate'});
 for(const key of ['invite',...CAMPAIGN_KEYS]){
  const value=query[key];
  if(typeof value==='string'&&value.trim()&&value.length<=256&&!/[\x00-\x1f\x7f]/.test(value))params.set(key,value.trim());
 }
 return '/auth?'+params.toString();
}
function signupCampaignContext(storage){
 try{const source=JSON.parse(storage.getItem('fmm_fan_acquisition_attribution')||'null');if(source?.utm_source!=='fan_acquisition'||typeof source.utm_campaign!=='string'||!source.utm_campaign)return null;const result={};for(const k of [...CAMPAIGN_KEYS,'landingPath','capturedAt'])if(typeof source[k]==='string'&&source[k].length<=256&&!/[\x00-\x1f\x7f]/.test(source[k]))result[k]=source[k];return result;}catch{return null;}
}
function appendCampaignParams(path,query={}){
 const u=new URL(path,'https://fixture.invalid');
 for(const key of CAMPAIGN_KEYS){const value=query[key];if(typeof value==='string'&&value.length<=256&&!/[\x00-\x1f\x7f]/.test(value))u.searchParams.set(key,value);}
 return u.pathname+u.search+u.hash;
}
module.exports={affiliateSignupDestination,signupCampaignContext,appendCampaignParams};
