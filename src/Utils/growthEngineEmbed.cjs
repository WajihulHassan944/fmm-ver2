'use strict';

function engineLocation(value) {
  try {
    const url = new URL(value);
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) return null;
    return { origin: url.origin, consoleUrl: `${url.origin}/api/growth/console` };
  } catch (_) { return null; }
}

function trustedConsoleMessage(event, origin, source) {
  return Boolean(origin && source && event.origin === origin && event.source === source
    && event.data && !Array.isArray(event.data) && event.data.type === 'fmm-growth-console'
    && typeof event.data.section === 'string' && event.data.section.length <= 64);
}

function sectionTarget(section, sections) {
  const entry = sections.find(item => item.slug === section) || sections[0];
  return `${entry.consoleSection || entry.slug}${entry.consoleQuery ? `?${entry.consoleQuery}` : ''}`;
}

function sameOriginSessionPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/api/') || /[\\\s?#]/.test(value)) return '';
  try { const u = new URL(value, 'https://frontend.invalid'); return u.origin === 'https://frontend.invalid' && u.pathname.startsWith('/api/') ? u.pathname : ''; }
  catch (_) { return ''; }
}

function consoleFrameHeight(value) {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 160 && value <= 30000 ? value : null;
}

module.exports = { consoleFrameHeight, engineLocation, trustedConsoleMessage, sectionTarget, sameOriginSessionPath };
