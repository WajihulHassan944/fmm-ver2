import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Calendar from 'react-calendar';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaChevronRight,
  FaClock,
  FaFistRaised,
  FaMapMarkerAlt,
  FaSyncAlt,
  FaTimes,
  FaTrophy,
} from 'react-icons/fa';
import { fetchMatches } from '@/Redux/matchSlice';

const FALLBACK_A = '/images/fmm-experience/fighter-action-red.jpg';
const FALLBACK_B = '/images/fmm-experience/fighter-action-blue.jpg';

const toCalendarKey = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${parsed.getFullYear()}-${month}-${day}`;
};

const getFightTitle = (match) => match?.matchName || `${match?.matchFighterA || 'Fighter A'} vs ${match?.matchFighterB || 'Fighter B'}`;
const getSport = (match) => match?.matchCategoryTwo || match?.matchCategory || 'Combat';

const formatFightTime = (time) => {
  if (!time) return 'Time pending';
  const parsed = new Date(`1970-01-01T${time}`);
  if (Number.isNaN(parsed.getTime())) return time;
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const Calandar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const [date, setDate] = useState(new Date());
  const [currentMatch, setCurrentMatch] = useState(null);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches({ includeDrafts: true }));
  }, [matchStatus, dispatch]);

  const matchRows = useMemo(() => (Array.isArray(matches) ? matches : []), [matches]);
  const selectedDateKey = toCalendarKey(date);

  const fightsByDate = useMemo(() => {
    const grouped = new Map();
    matchRows.forEach((match) => {
      const key = toCalendarKey(match?.matchDate);
      if (!key) return;
      const current = grouped.get(key) || [];
      current.push(match);
      grouped.set(key, current);
    });
    return grouped;
  }, [matchRows]);

  const selectedMatches = useMemo(() => fightsByDate.get(selectedDateKey) || [], [fightsByDate, selectedDateKey]);

  const nextScheduled = useMemo(() => matchRows
    .filter((match) => toCalendarKey(match?.matchDate))
    .slice()
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
    .slice(0, 5), [matchRows]);

  const dateCount = fightsByDate.size;

  return (
    <div className="admin-workspace admin-calendar-workspace">
      <section className="admin-page-heading">
        <div>
          <span>Fight scheduling</span>
          <h2>Match calendar</h2>
          <p>Inspect scheduled fight cards by date, open full bout details, and keep the original match data flow intact.</p>
        </div>
        <div className="admin-heading-actions">
          <button type="button" className="admin-action-secondary" onClick={() => router.back()}><FaArrowLeft /> Back</button>
          <button type="button" className="admin-action-secondary" onClick={() => dispatch(fetchMatches({ includeDrafts: true }))}><FaSyncAlt className={matchStatus === 'loading' ? 'xp-spin' : ''} /> Refresh</button>
        </div>
      </section>

      <section className="admin-calendar-metrics" aria-label="Calendar summary">
        <article><span><FaFistRaised /></span><div><small>Fight records</small><strong>{matchRows.length}</strong></div></article>
        <article><span><FaCalendarAlt /></span><div><small>Scheduled dates</small><strong>{dateCount}</strong></div></article>
        <article><span><FaTrophy /></span><div><small>Selected date</small><strong>{selectedMatches.length}</strong></div></article>
      </section>

      <section className="admin-calendar-layout">
        <article className="admin-calendar-panel">
          <header>
            <div><span>Schedule board</span><h3>Select a fight date</h3></div>
            <small>Highlighted dates contain one or more fight records.</small>
          </header>
          <Calendar
            onChange={setDate}
            value={date}
            className="admin-premium-calendar"
            tileClassName={({ date: tileDate, view }) => {
              if (view !== 'month') return undefined;
              return fightsByDate.has(toCalendarKey(tileDate)) ? 'has-fights' : undefined;
            }}
            tileContent={({ date: tileDate, view }) => {
              if (view !== 'month') return null;
              const count = (fightsByDate.get(toCalendarKey(tileDate)) || []).length;
              return count ? <span className="admin-calendar-event-count">{count}</span> : null;
            }}
          />
        </article>

        <aside className="admin-calendar-agenda">
          <header>
            <div><span>Selected day</span><h3>{date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3></div>
            <strong>{selectedMatches.length}</strong>
          </header>

          <div className="admin-calendar-fight-list">
            {selectedMatches.length ? selectedMatches.map((match, index) => (
              <button type="button" key={match?._id || index} onClick={() => setCurrentMatch(match)} className="admin-calendar-fight-row">
                <span className="admin-calendar-fighter-images">
                  <img src={match?.fighterAImage || FALLBACK_A} alt="" />
                  <img src={match?.fighterBImage || FALLBACK_B} alt="" />
                </span>
                <span className="admin-calendar-fight-copy">
                  <strong>{getFightTitle(match)}</strong>
                  <small><FaClock /> {formatFightTime(match?.matchTime)} · {getSport(match)}</small>
                </span>
                <FaChevronRight aria-hidden="true" />
              </button>
            )) : (
              <div className="admin-calendar-empty">
                <FaCalendarAlt />
                <strong>No fights on this date</strong>
                <p>Select a highlighted date to inspect its scheduled cards.</p>
              </div>
            )}
          </div>

          <footer>
            <span>Next scheduled cards</span>
            {nextScheduled.length ? nextScheduled.map((match, index) => (
              <button type="button" key={`next-${match?._id || index}`} onClick={() => {
                const key = toCalendarKey(match?.matchDate);
                const [year, month, day] = key.split('-').map(Number);
                setDate(new Date(year, month - 1, day));
              }}>
                <strong>{toCalendarKey(match?.matchDate)}</strong>
                <small>{getFightTitle(match)}</small>
              </button>
            )) : <p>No dated fights are currently available.</p>}
          </footer>
        </aside>
      </section>

      {currentMatch && (
        <div className="admin-modal-backdrop admin-calendar-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCurrentMatch(null);
        }}>
          <section className="admin-calendar-fight-modal" role="dialog" aria-modal="true" aria-labelledby="admin-calendar-match-title">
            <button type="button" className="admin-modal-close" onClick={() => setCurrentMatch(null)} aria-label="Close fight details"><FaTimes /></button>
            <div className="admin-calendar-modal-visual">
              <article><img src={currentMatch.fighterAImage || FALLBACK_A} alt={currentMatch.matchFighterA || 'Fighter A'} /><strong>{currentMatch.matchFighterA || 'Fighter A'}</strong><span>Red corner</span></article>
              <b>VS</b>
              <article><img src={currentMatch.fighterBImage || FALLBACK_B} alt={currentMatch.matchFighterB || 'Fighter B'} /><strong>{currentMatch.matchFighterB || 'Fighter B'}</strong><span>Blue corner</span></article>
            </div>
            <div className="admin-calendar-modal-copy">
              <span>{getSport(currentMatch)} · {currentMatch.matchType || currentMatch.matchStatus || 'Fight card'}</span>
              <h3 id="admin-calendar-match-title">{getFightTitle(currentMatch)}</h3>
              <p>{currentMatch.matchDescription || 'No match description has been supplied.'}</p>
              <dl>
                <div><dt><FaCalendarAlt /> Date</dt><dd>{toCalendarKey(currentMatch.matchDate) || 'Date pending'}</dd></div>
                <div><dt><FaClock /> Time</dt><dd>{formatFightTime(currentMatch.matchTime)}</dd></div>
                <div><dt><FaMapMarkerAlt /> Venue</dt><dd>{currentMatch.venue || 'Venue pending'}</dd></div>
                <div><dt><FaTrophy /> Prize</dt><dd>{Number(currentMatch.pot || 0) ? `$${Number(currentMatch.pot).toLocaleString()}` : 'Not specified'}</dd></div>
              </dl>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Calandar;
