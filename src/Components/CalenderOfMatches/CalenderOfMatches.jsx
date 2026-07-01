import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
import Calendar from 'react-calendar';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
  FaFistRaised,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaTimes,
  FaTrophy,
} from 'react-icons/fa';

const formatDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const formatTime = (value) => {
  if (!value) return 'Time TBA';
  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const CalenderOfMatches = () => {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const safeMatches = Array.isArray(matches) ? matches : [];

  const [date, setDate] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [highlightedDates, setHighlightedDates] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches());
  }, [matchStatus, dispatch]);

  useEffect(() => {
    setHighlightedDates(new Set(safeMatches.map((match) => formatDateKey(match?.matchDate)).filter(Boolean)));
  }, [safeMatches]);

  const upcomingCount = useMemo(() => {
    const today = formatDateKey(new Date());
    return safeMatches.filter((match) => formatDateKey(match?.matchDate) >= today).length;
  }, [safeMatches]);

  const currentMonthCount = useMemo(() => safeMatches.filter((match) => {
    const matchDate = new Date(match?.matchDate);
    return !Number.isNaN(matchDate.getTime())
      && matchDate.getMonth() === viewDate.getMonth()
      && matchDate.getFullYear() === viewDate.getFullYear();
  }).length, [safeMatches, viewDate]);

  const handleDateChange = (selectedDate) => {
    setDate(selectedDate);
    const formattedDate = formatDateKey(selectedDate);
    const filteredMatches = safeMatches.filter((match) => formatDateKey(match?.matchDate) === formattedDate);
    setSelectedMatches(filteredMatches);
    setDateModalVisible(filteredMatches.length > 0);
  };

  const changeMonth = (direction) => {
    setViewDate((previous) => {
      const nextDate = new Date(previous);
      nextDate.setMonth(nextDate.getMonth() + direction);
      return nextDate;
    });
    setDate(null);
    setSelectedMatches([]);
    setDateModalVisible(false);
  };

  const openMatch = (match) => {
    setCurrentMatch(match);
    setDateModalVisible(false);
    setModalVisible(true);
  };

  const closeMatch = () => {
    setModalVisible(false);
    setCurrentMatch(null);
  };

  return (
    <section className="premium-calendar-phase-two">
      <div className="premium-calendar-phase-two-glow" aria-hidden="true" />
      <div className="theme-container premium-calendar-phase-two-shell">
        <header className="premium-calendar-phase-two-header">
          <div>
            <p className="xp-eyebrow"><FaCalendarAlt /> Fight-night planner</p>
            <h2>Every card. Every date. One premium calendar.</h2>
            <p>
              Move month by month, select a highlighted date, and open the same fight details already
              provided by the production match feed.
            </p>
          </div>
          <div className="premium-calendar-phase-two-stats">
            <article><FaFistRaised /><strong>{safeMatches.length}</strong><span>Total fights</span></article>
            <article><FaTrophy /><strong>{upcomingCount}</strong><span>Upcoming</span></article>
            <article><FaCalendarAlt /><strong>{currentMonthCount}</strong><span>This month</span></article>
          </div>
        </header>

        <div className="premium-calendar-phase-two-layout">
          <aside className="premium-calendar-phase-two-art">
            <div>
              <span><FaShieldAlt /> Live schedule data</span>
              <h3>Plan your predictions before the bell.</h3>
              <p>Highlighted dates contain one or more fight cards. Select a day to open the event list.</p>
            </div>
          </aside>

          <div className="premium-calendar-phase-two-card">
            <div className="premium-calendar-phase-two-toolbar">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month"><FaArrowLeft /></button>
              <div>
                <small>Fight calendar</small>
                <h3>{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
              </div>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Next month"><FaArrowRight /></button>
            </div>

            <Calendar
              onChange={handleDateChange}
              value={date}
              activeStartDate={viewDate}
              onActiveStartDateChange={({ activeStartDate }) => setViewDate(activeStartDate)}
              className="premium-calendar-control"
              tileClassName={({ date: tileDate, view }) => (
                view === 'month' && highlightedDates.has(formatDateKey(tileDate))
                  ? 'premium-calendar-highlighted'
                  : null
              )}
              showNavigation={false}
            />

            <div className="premium-calendar-phase-two-legend">
              <span><i /> Fight card scheduled</span>
              <span>Select any highlighted date to inspect the card.</span>
            </div>
          </div>
        </div>
      </div>

      {dateModalVisible && (
        <div className="premium-calendar-modal-backdrop" onClick={() => setDateModalVisible(false)}>
          <div className="premium-calendar-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="premium-calendar-modal-close" onClick={() => setDateModalVisible(false)}><FaTimes /></button>
            <p className="xp-eyebrow"><FaCalendarAlt /> Selected fight date</p>
            <h2>{date?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
            <div className="premium-calendar-event-list">
              {selectedMatches.map((match, index) => (
                <button type="button" key={match?._id || index} onClick={() => openMatch(match)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{match?.matchName || `${match?.matchFighterA || 'Fighter A'} vs ${match?.matchFighterB || 'Fighter B'}`}</strong>
                    <small><FaClock /> {formatTime(match?.matchTime)} · <FaMapMarkerAlt /> {match?.venue || 'Venue TBA'}</small>
                  </div>
                  <FaArrowRight />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalVisible && currentMatch && (
        <div className="premium-calendar-modal-backdrop" onClick={closeMatch}>
          <div className="premium-calendar-modal is-fight-detail" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="premium-calendar-modal-close" onClick={closeMatch}><FaTimes /></button>
            <p className="xp-eyebrow"><FaFistRaised /> Fight details</p>
            <h2>{currentMatch.matchName || `${currentMatch.matchFighterA || 'Fighter A'} vs ${currentMatch.matchFighterB || 'Fighter B'}`}</h2>
            <p>{currentMatch.matchDescription || 'Fight-card details are provided by the existing match feed.'}</p>
            <div className="premium-calendar-fighter-pair">
              <figure><img src={currentMatch.fighterAImage || '/images/fmm-experience/fighter-jadden-addison.webp'} alt={currentMatch.matchFighterA || 'Fighter A'} /><figcaption>{currentMatch.matchFighterA || 'Fighter A'}</figcaption></figure>
              <span>VS</span>
              <figure><img src={currentMatch.fighterBImage || '/images/fmm-experience/fighter-zaveer-davis.webp'} alt={currentMatch.matchFighterB || 'Fighter B'} /><figcaption>{currentMatch.matchFighterB || 'Fighter B'}</figcaption></figure>
            </div>
            <div className="premium-calendar-fight-meta">
              <span><FaCalendarAlt /> {formatDateKey(currentMatch.matchDate) || 'Date TBA'}</span>
              <span><FaClock /> {formatTime(currentMatch.matchTime)}</span>
              <span><FaMapMarkerAlt /> {currentMatch.venue || 'Venue TBA'}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CalenderOfMatches;
