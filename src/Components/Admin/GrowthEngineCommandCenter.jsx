import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { GROWTH_ENGINE_V2, GROWTH_SECTIONS } from '@/Utils/adminFeatures';
import { GROWTH_CONSOLE_URL, GROWTH_ENGINE_URL, growthEngineApi } from '@/Utils/growthEngineApi';
import styles from './GrowthEngineCommandCenter.module.css';

const SLUGS = new Set(GROWTH_SECTIONS.map((s) => s.slug));
const hrefFor = (slug) => (slug === 'overview' ? '/administration/growth-engine' : `/administration/growth-engine/${slug}`);
const engineOrigin = (() => { try { return new URL(GROWTH_ENGINE_URL).origin; } catch (_error) { return ''; } })();

// One Growth Engine command center inside the admin back office. The working Growth
// Engine console is embedded (it only allows framing by the admin site's own origins
// and keeps its own owner sign-in). Admin navigation selects the section.
export default function GrowthEngineCommandCenter() {
  const router = useRouter();
  const requested = Array.isArray(router.query.section) ? router.query.section[0] : '';
  const section = SLUGS.has(requested) ? requested : 'overview';
  const [reach, setReach] = useState('checking'); // checking | ok | unreachable
  const frame = useRef(null);
  const src = useMemo(() => `${GROWTH_CONSOLE_URL}?embed=1#/${section}`, [section]);

  useEffect(() => {
    let alive = true;
    growthEngineApi.health().then(() => alive && setReach('ok')).catch((e) => alive && setReach(e.unreachable ? 'unreachable' : 'ok'));
    return () => { alive = false; };
  }, []);

  // Navigating inside the console keeps the admin menu in sync (messages accepted only from the engine).
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== engineOrigin || event.data?.type !== 'fmm-growth-console') return;
      const s = event.data.section;
      if (SLUGS.has(s) && s !== section) router.replace(hrefFor(s), undefined, { shallow: true });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [router, section]);

  if (!GROWTH_ENGINE_V2) {
    return <main className={styles.page}><p>The Growth Engine command center is turned off. <Link href="/administration">Back to the command center</Link></p></main>;
  }

  return (
    <main className={styles.page} data-testid="growth-engine-command-center">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>FANTASY MMADNESS · GROWTH ENGINE</span>
          <h1>Growth Engine</h1>
          <p className={styles.muted}>Staging: nothing is sent, posted or charged without your approval. The Growth Engine has its own owner password.</p>
        </div>
        <a className={styles.linkButton} href={`${GROWTH_CONSOLE_URL}#/${section}`} target="_blank" rel="noopener noreferrer">Open in a new tab <FaExternalLinkAlt aria-hidden="true" /></a>
      </header>

      <nav className={styles.tabs} aria-label="Growth Engine sections">
        {GROWTH_SECTIONS.map((s) => (
          <Link key={s.slug} href={hrefFor(s.slug)} shallow className={`${styles.tab} ${s.slug === section ? styles.tabActive : ''}`} aria-current={s.slug === section ? 'page' : undefined} data-testid={`ge-tab-${s.slug}`}>{s.label}</Link>
        ))}
      </nav>

      {reach === 'checking' && <p className={styles.muted}>Connecting to the Growth Engine…</p>}
      {reach === 'unreachable' && (
        <section className={styles.card} data-testid="ge-unreachable">
          <h2>Open the Growth Engine in its own tab</h2>
          <p>The admin site cannot load the Growth Engine here yet, because its staging address ({GROWTH_ENGINE_URL}) is behind Vercel sign-in. The button opens the same section in a new tab.</p>
          <a className={styles.primary} href={`${GROWTH_CONSOLE_URL}#/${section}`} target="_blank" rel="noopener noreferrer">Open {GROWTH_SECTIONS.find((s) => s.slug === section)?.label} <FaExternalLinkAlt aria-hidden="true" /></a>
        </section>
      )}
      {reach === 'ok' && (
        <iframe ref={frame} className={styles.frame} src={src} title={`Growth Engine — ${GROWTH_SECTIONS.find((s) => s.slug === section)?.label}`} data-testid="ge-frame" referrerPolicy="no-referrer" />
      )}
    </main>
  );
}
