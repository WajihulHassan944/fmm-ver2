'use strict';
const { createGrowthSessionBridge } = require('./growthSessionBridge.cjs');
function socialBridgeEnv(env) {
  if (env.VERCEL_ENV !== 'preview') return null;
  let engine, site;
  try { engine = new URL(env.GROWTH_SOCIAL_ENGINE_ORIGIN); site = new URL(env.GROWTH_SOCIAL_ADMIN_SITE_ORIGIN); } catch { return null; }
  if (engine.protocol !== 'https:' || !/^fantasymmadness-growth-[a-z0-9-]+\.vercel\.app$/.test(engine.hostname) || engine.href !== engine.origin + '/' || site.protocol !== 'https:' || !/^fmm-ver2-[a-z0-9-]+\.vercel\.app$/.test(site.hostname) || site.href !== site.origin + '/') return null;
  return { ...env, GROWTH_SSO: 'on', GROWTH_SSO_SITE_PRIVATE_KEY: (env.GROWTH_SOCIAL_SSO_KEY_BINDING === 'existing_staging_key' ? env.GROWTH_SSO_SITE_PRIVATE_KEY : env.GROWTH_SOCIAL_SSO_PRIVATE_KEY) || '', GROWTH_ENGINE_SERVER_URL: engine.origin, GROWTH_SITE_ORIGINS: site.origin,
    // Verify the existing website session at its authority; never use an unrelated Preview JWT key.
    FMM_ADMIN_VERIFY_URL: 'https://fantasymmadness-game-server-three-taupe.vercel.app', JWT_SECRET_ADMIN: '', GROWTH_SSO_ALLOWED_ADMINS: env.GROWTH_SOCIAL_ALLOWED_ADMINS || '' };
}
function createSocialSessionBridge(env, options = {}) { const config = socialBridgeEnv(env); return config ? createGrowthSessionBridge({ ...options, env: config }) : null; }
module.exports = { socialBridgeEnv, createSocialSessionBridge };
