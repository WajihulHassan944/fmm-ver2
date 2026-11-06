// Preview-only forwarding. No fallback to the live signup backend.
function affiliateAcceptanceConfig(env=process.env){
 if(env.FMM_GROWTH_AFFILIATE_ACCEPTANCE_ENABLED!=='true')return null;
 let origin;try{origin=new URL(env.GROWTH_SOCIAL_ENGINE_ORIGIN).origin;}catch{return null;}
 if(env.VERCEL_ENV==='preview'&&origin==='https://fantasymmadness-growth-git-585652-kelly-davis-projects-6c108d0b.vercel.app')return{origin};
 if(!env.VERCEL&&env.FMM_INTEGRATION_TEST_DIST_DIR&&/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))return{origin};
 return null;
}
module.exports={affiliateAcceptanceConfig};
