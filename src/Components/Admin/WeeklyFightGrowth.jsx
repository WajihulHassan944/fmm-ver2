import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FaCopy, FaExternalLinkAlt, FaRobot, FaSyncAlt } from 'react-icons/fa';
import { fetchPublicPredictionFights } from '@/Utils/publicApi';
import { formatFightDate, getFightId, getFighterImage, getFighterName, parseFightDate } from '@/Utils/fightExperience';
import { swarmApi } from '@/Utils/swarmApi';
import styles from './WeeklyFightGrowth.module.css';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const formatSport = (fight) => String(fight.matchCategoryTwo || fight.matchCategory || 'Combat').replace(/[_-]/g, ' ');
const titleFor = (fight) => [getFighterName(fight, 'A'), getFighterName(fight, 'B')].filter(Boolean).join(' vs ') || fight.matchName || 'Fight';

// This is an operational priority score, not an estimate of audience demand.
export const rankWeeklyFights = (rows, now = Date.now()) => {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : []).map((fight) => {
    const id = String(getFightId(fight) || '');
    const scheduled = parseFightDate(fight)?.getTime();
    const lock = fight.lockAt ? new Date(fight.lockAt).getTime() : scheduled;
    const status = String(fight.matchStatus || fight.status || '').toLowerCase();
    if (!id || !Number.isFinite(scheduled) || scheduled < now || scheduled > now + WEEK_MS
      || !Number.isFinite(lock) || lock <= now || /draft|closed|finished|complete|cancel/.test(status)) return null;
    const hours = (scheduled - now) / 3600000;
    const hasPhotos = Boolean(fight.fighterAImage || fight.fighterAId?.primaryImage)
      && Boolean(fight.fighterBImage || fight.fighterBId?.primaryImage);
    const promoted = Boolean(fight.homepagePromoted || fight.featuredThisWeek || fight.featuredFight);
    const score = (hours <= 48 ? 50 : hours <= 96 ? 35 : 20) + (hasPhotos ? 20 : 0)
      + (promoted ? 15 : 0) + (fight.matchDescription ? 5 : 0);
    const reasons = [`${hours <= 48 ? 'Within 48 hours' : hours <= 96 ? 'Within four days' : 'This week'}`];
    if (promoted) reasons.push('Already featured');
    if (hasPhotos) reasons.push('Both fighter photos ready');
    return { id, fight, score, scheduled, reasons };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.scheduled - b.scheduled)
    .filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true; }).slice(0, 3);
};

const WeeklyFightGrowth = () => {
  const [fights, setFights] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const picks = useMemo(() => rankWeeklyFights(fights), [fights]);
  const pickIds = picks.map((pick) => pick.id).join(',');

  const loadFights = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setFights(await fetchPublicPredictionFights({ limit: 240, hydrateImages: false }));
    } catch (loadError) {
      setError(loadError.message || 'Could not load fights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFights(); }, [loadFights]);

  useEffect(() => {
    if (!pickIds) return;
    let active = true;
    Promise.all(pickIds.split(',').map(async (id) => {
      try {
        const [artifacts, campaigns] = await Promise.allSettled([
          swarmApi.listArtifacts({ fightId: id, limit: 20, fallbackCache: true }),
          swarmApi.listCampaigns({ fightId: id, limit: 10, fallbackCache: true }),
        ]);
        return [id, { artifacts: artifacts.status === 'fulfilled' ? artifacts.value?.items || [] : [],
          campaigns: campaigns.status === 'fulfilled' ? campaigns.value?.items || [] : [],
          error: artifacts.status === 'rejected' ? artifacts.reason?.message || 'Swarm unavailable.' : '' }];
      } catch (loadError) { return [id, { error: loadError.message || 'Swarm unavailable.' }]; }
    })).then((rows) => { if (active) setDrafts(Object.fromEntries(rows)); });
    return () => { active = false; };
  }, [pickIds]);

  const copyLink = async (id) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/fight/${encodeURIComponent(id)}?play=1&utm_source=owner&utm_medium=share&utm_campaign=weekly_fights`);
      toast.success('Fight link copied.');
    } catch (_error) { toast.error('Could not copy the link. Open the fight and copy its address instead.'); }
  };

  const requestDraft = async ({ id, fight }) => {
    setBusyId(id);
    try {
      const result = await swarmApi.createFightCampaign({
        fightId: id, matchId: id, sport: String(fight.matchCategoryTwo || fight.matchCategory || 'combat').toLowerCase(),
        title: titleFor(fight), eventName: fight.matchName || titleFor(fight),
        mode: 'APPROVAL_REQUIRED', includeAll: true,
        input: { fightId: id, matchId: id, matchTitle: titleFor(fight), matchDate: fight.matchDate, matchTime: fight.matchTime,
          matchFighterA: getFighterName(fight, 'A'), matchFighterB: getFighterName(fight, 'B'),
          callToAction: `Play this fight: https://www.fantasymmadness.com/fight/${encodeURIComponent(id)}?play=1` },
      });
      toast.success('Swarm draft pack requested. Review it in the existing Swarm queue.');
      const artifacts = await swarmApi.listArtifacts({ fightId: id, limit: 20, fallbackCache: true });
      setDrafts((current) => ({ ...current, [id]: { ...(current[id] || {}), artifacts: artifacts?.items || [],
        campaigns: [result.campaign || { campaignId: result.campaignId || `requested-${id}` }, ...(current[id]?.campaigns || [])] } }));
    } catch (requestError) { toast.error(requestError.message || 'Could not request drafts.'); }
    finally { setBusyId(''); }
  };

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><span className={styles.eyebrow}>FANTASY MMADNESS · GROWTH</span><h1>This Week’s Three Fights</h1>
        <p>Start with the fights players can enter this week. Review an existing Swarm draft and share the direct fight link.</p></div>
      <button type="button" className={styles.secondary} onClick={loadFights} disabled={loading}><FaSyncAlt /> Refresh fights</button>
    </header>
    <div className={styles.summary}><span>Ranked by time until the fight, ready photos, and existing featured placement.</span><span>Swarm drafts need your review. Per-fight signup and prediction attribution is not connected yet.</span></div>
    {error && <p role="alert" className={styles.notice}>{error}</p>}
    {loading ? <p className={styles.notice}>Loading open fights…</p> : !picks.length ? <div className={styles.empty}><h2>No eligible fights in the next seven days</h2><p>Publish a fight with an open entry window to see it here.</p><Link href="/administration/fights">Open Fight Registry</Link></div> :
      <div className={styles.grid}>{picks.map(({ id, fight, reasons }, index) => {
        const queue = drafts[id];
        const ready = (queue?.artifacts || []).filter((artifact) => ['DRAFT', 'AWAITING_REVIEW'].includes(String(artifact.reviewStatus || '').toUpperCase()));
        return <article className={styles.card} key={id}>
          <div className={styles.cardHead}><span>#{index + 1} TO PROMOTE</span><span>{formatSport(fight)}</span></div>
          <div className={styles.fighters}>
            <img src={getFighterImage(fight, 'A')} alt={getFighterName(fight, 'A')} />
            <span>VS</span><img src={getFighterImage(fight, 'B')} alt={getFighterName(fight, 'B')} />
          </div>
          <h2>{titleFor(fight)}</h2><p className={styles.date}>{formatFightDate(fight)} · Predictions open</p>
          <div className={styles.reasons}>{reasons.map((reason) => <span key={reason}>{reason}</span>)}</div>
          <section className={styles.drafts}><strong>Swarm for this fight</strong>
            {queue?.error ? <p>{queue.error} <Link href="/administration/swarm">Check Swarm</Link></p>
              : queue ? <p>{ready.length} draft{ready.length === 1 ? '' : 's'} waiting for review · {(queue.campaigns || []).length} campaign{queue.campaigns?.length === 1 ? '' : 's'} on record</p>
                : <p>Checking existing drafts…</p>}
            <div className={styles.actions}>
              <Link href={`/administration/swarm?tab=artifacts&fightId=${encodeURIComponent(id)}`}>Review drafts</Link>
              <button type="button" onClick={() => requestDraft({ id, fight })} disabled={busyId === id || !queue || Boolean(ready.length || queue.campaigns?.length)}><FaRobot /> {busyId === id ? 'Requesting…' : ready.length ? 'Drafts ready' : queue.campaigns?.length ? 'Campaign on record' : 'Prepare drafts'}</button>
            </div>
          </section>
          <div className={styles.actions}><Link href={`/fight/${encodeURIComponent(id)}?play=1`} target="_blank" rel="noopener noreferrer"><FaExternalLinkAlt /> View player page</Link><button type="button" onClick={() => copyLink(id)}><FaCopy /> Copy fight link</button></div>
        </article>;
      })}</div>}
    <footer className={styles.footer}><Link href="/administration/july-growth">Open existing growth jobs</Link><Link href="/administration/swarm">Open Swarm command center</Link></footer>
  </main>;
};

export default WeeklyFightGrowth;
