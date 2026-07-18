import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
import { buildPublicApiUrl, fetchPublicFightCalendar } from '@/Utils/publicApi';
import Calendar from 'react-calendar';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
  FaFistRaised,
  FaMapMarkerAlt,
  FaNewspaper,
  FaShieldAlt,
  FaTimes,
  FaTrophy,
} from 'react-icons/fa';

const formatDateKey = (value) => {
  if (!value && !(value instanceof Date)) return '';
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

const cleanCalendarText = (value) => String(value ?? '').trim();

const isUsableCalendarText = (value) => {
  const text = cleanCalendarText(value);
  return Boolean(text && !['null', 'undefined', 'none', 'n/a'].includes(text.toLowerCase()));
};

const pickCalendarText = (...values) => {
  for (const value of values) {
    if (isUsableCalendarText(value)) return cleanCalendarText(value);
  }
  return '';
};

const NEWS_EVENT_DATE_FIELDS = [
  'eventDate',
  'event_date',
  'calendarDate',
  'calendar_date',
  'fightDate',
  'fight_date',
  'matchDate',
  'match_date',
  'scheduledDate',
  'scheduled_date',
  'scheduledAt',
  'scheduled_at',
  'startsAt',
  'starts_at',
  'startDate',
  'start_date',
];

const NEWS_EVENT_TIME_FIELDS = [
  'eventTime',
  'event_time',
  'fightTime',
  'fight_time',
  'matchTime',
  'match_time',
  'scheduledTime',
  'scheduled_time',
  'time',
];

const MONTH_INDEX = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const buildLocalDateKey = (year, monthIndex, day) => {
  const normalizedYear = Number(year);
  const normalizedMonth = Number(monthIndex);
  const normalizedDay = Number(day);
  const date = new Date(normalizedYear, normalizedMonth, normalizedDay);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== normalizedYear ||
    date.getMonth() !== normalizedMonth ||
    date.getDate() !== normalizedDay
  ) {
    return '';
  }

  return [
    normalizedYear,
    String(normalizedMonth + 1).padStart(2, '0'),
    String(normalizedDay).padStart(2, '0'),
  ].join('-');
};

const coerceNewsDateValue = (value) => {
  if (!isUsableCalendarText(value)) return '';
  const text = cleanCalendarText(value);
  const isoMatch = text.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) return buildLocalDateKey(isoMatch[1], Number(isoMatch[2]) - 1, isoMatch[3]);

  if (value instanceof Date || /^20\d{2}-\d{2}-\d{2}T/.test(text)) {
    const direct = formatDateKey(value);
    if (direct) return direct;
  }

  return parseNewsDateFromText(text);
};

const inferYearForNewsDate = (monthIndex, day, now = new Date()) => {
  const currentYear = now.getFullYear();
  const candidate = new Date(currentYear, monthIndex, day);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return candidate < sixMonthsAgo ? currentYear + 1 : currentYear;
};

const parseNewsDateFromText = (text, now = new Date()) => {
  const source = cleanCalendarText(text);
  if (!source) return '';

  const isoMatch = source.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const key = buildLocalDateKey(isoMatch[1], Number(isoMatch[2]) - 1, isoMatch[3]);
    if (key) return key;
  }

  const slashMatch = source.match(/\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(20\d{2}|\d{2})\b/);
  if (slashMatch) {
    const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
    const key = buildLocalDateKey(year, Number(slashMatch[1]) - 1, slashMatch[2]);
    if (key) return key;
  }

  const textMonthMatch = source.match(
    /\b(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)?,?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?\b/i,
  );
  if (textMonthMatch) {
    const monthIndex = MONTH_INDEX[textMonthMatch[1].toLowerCase().replace('.', '')];
    if (monthIndex !== undefined) {
      const day = Number(textMonthMatch[2]);
      const year = textMonthMatch[3] || inferYearForNewsDate(monthIndex, day, now);
      const key = buildLocalDateKey(year, monthIndex, day);
      if (key) return key;
    }
  }

  const dayMonthMatch = source.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?(?:,?\s*(20\d{2}))?\b/i,
  );
  if (dayMonthMatch) {
    const monthIndex = MONTH_INDEX[dayMonthMatch[2].toLowerCase().replace('.', '')];
    if (monthIndex !== undefined) {
      const day = Number(dayMonthMatch[1]);
      const year = dayMonthMatch[3] || inferYearForNewsDate(monthIndex, day, now);
      const key = buildLocalDateKey(year, monthIndex, day);
      if (key) return key;
    }
  }

  return '';
};

const getNewsEventDateKey = (article = {}) => {
  for (const field of NEWS_EVENT_DATE_FIELDS) {
    const key = coerceNewsDateValue(article?.[field]);
    if (key) return key;
  }

  const rawText = [article?.title, article?.description, article?.summary, article?.content]
    .filter(isUsableCalendarText)
    .join(' · ');
  return parseNewsDateFromText(rawText);
};

const getNewsEventTime = (article = {}) => {
  for (const field of NEWS_EVENT_TIME_FIELDS) {
    if (isUsableCalendarText(article?.[field])) return cleanCalendarText(article[field]);
  }

  const rawText = [article?.title, article?.description, article?.summary, article?.content]
    .filter(isUsableCalendarText)
    .join(' · ');
  const timeMatch = rawText.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b(?:\s*(?:et|est|edt|pt|pst|pdt|ct|cst|cdt))?/i);
  if (!timeMatch) return '';
  return `${timeMatch[1]}:${timeMatch[2] || '00'} ${timeMatch[3].toUpperCase()}`;
};

const NEWS_EVENT_INTENT_PATTERN = /\b(?:ufc\s*\d+|ufc\s+fight\s+night|fight\s+night|noche\s+ufc|fight\s+card|main\s+event|co-main|title\s+fight|championship|\bvs\.?\b|set\s+for|scheduled\s+for|booked\s+for|targeted\s+for|announced?|returns?\s+to|headed\s+to)\b/i;
const NEWS_NON_CALENDAR_PATTERN = /\b(?:results?|recap|post[-\s]?fight|rankings?|opinion|mailbag|podcast|odds|betting|picks?|prediction(?:s)?|injur(?:y|ies|ed)|released?|signs?\s+with)\b/i;

const hasExplicitNewsEventDate = (article = {}) => NEWS_EVENT_DATE_FIELDS.some((field) => isUsableCalendarText(article?.[field]));

const isUpcomingNewsDateKey = (dateKey) => {
  if (!dateKey) return false;
  const eventDate = new Date(`${dateKey}T23:59:59`);
  if (Number.isNaN(eventDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate >= today;
};

const hasCalendarNewsIntent = (article = {}) => {
  if (article?.calendarEligible === true || article?.isCalendarEvent === true || article?.eventDiscovered === true) return true;
  if (hasExplicitNewsEventDate(article)) return true;
  const text = [article?.eventName, article?.matchName, article?.title, article?.headline, article?.description, article?.summary, article?.content]
    .filter(isUsableCalendarText)
    .join(' · ');
  if (!text) return false;
  if (NEWS_NON_CALENDAR_PATTERN.test(text) && !NEWS_EVENT_INTENT_PATTERN.test(text)) return false;
  return NEWS_EVENT_INTENT_PATTERN.test(text);
};

const isCalendarNewsEvent = (item = {}) => item?.__calendarType === 'news';

const getCalendarTitle = (item = {}) =>
  item?.matchName ||
  item?.title ||
  `${item?.matchFighterA || 'Fighter A'} vs ${item?.matchFighterB || 'Fighter B'}`;

const normalizeNewsIntoCalendarEvent = (article = {}, index = 0) => {
  const eventDateKey = getNewsEventDateKey(article);
  if (!eventDateKey || !isUpcomingNewsDateKey(eventDateKey) || !hasCalendarNewsIntent(article)) return null;

  const title = pickCalendarText(article?.eventName, article?.matchName, article?.title, article?.headline, 'Fight news event');
  const description = pickCalendarText(
    article?.description,
    article?.summary,
    article?.content,
    'This news item references a dated fight event.',
  );

  return {
    _id: `news-calendar-${article?._id || article?.id || index}`,
    __calendarType: 'news',
    matchName: title,
    title,
    matchDescription: description,
    description,
    matchDate: eventDateKey,
    matchTime: getNewsEventTime(article),
    venue: pickCalendarText(article?.venue, article?.location, article?.eventLocation, article?.city, 'News update'),
    source: pickCalendarText(article?.articleSource, article?.sourceName, article?.source, article?.publisher, 'Fight news'),
    link: pickCalendarText(article?.link, article?.url, article?.sourceUrl, article?.articleUrl),
    matchFighterA: pickCalendarText(article?.matchFighterA, article?.fighterA),
    matchFighterB: pickCalendarText(article?.matchFighterB, article?.fighterB),
    rawArticle: article,
  };
};

const normalizeNewsPayloadRows = (payload) => {
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.calendarEvents)) return payload.calendarEvents;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.news)) return payload.news;
  if (Array.isArray(payload?.items)) return payload.items;
  return Array.isArray(payload) ? payload : [];
};

const requestCalendarNewsRows = async (path, query = {}) => {
  const response = await fetch(buildPublicApiUrl(path, query), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`News request failed with status ${response.status}`);
  return normalizeNewsPayloadRows(await response.json());
};

const fetchCalendarNewsEvents = async () => {
  const rows = [];
  const failures = [];

  try {
    rows.push(...await requestCalendarNewsRows('/api/public/fight-news-calendar', { upcomingOnly: true, limit: 100 }));
  } catch (error) {
    failures.push(error);
    console.info('Dedicated news calendar feed unavailable:', error.message);
  }

  try {
    rows.push(...await requestCalendarNewsRows('/news'));
  } catch (error) {
    failures.push(error);
    console.info('General news feed unavailable for calendar mapping:', error.message);
  }

  if (!rows.length && failures.length) throw failures[0];

  const seen = new Set();
  return rows
    .map(normalizeNewsIntoCalendarEvent)
    .filter(Boolean)
    .filter((event) => {
      const key = `${event.matchDate}:${event.title}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const CalenderOfMatches = () => {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const reduxMatches = Array.isArray(matches) ? matches : [];
  const [calendarMatches, setCalendarMatches] = useState([]);
  const [calendarNewsEvents, setCalendarNewsEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const safeMatches = calendarMatches.length ? calendarMatches : reduxMatches;
  const allCalendarItems = useMemo(
    () => [...safeMatches, ...calendarNewsEvents],
    [calendarNewsEvents, safeMatches],
  );

  const [date, setDate] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [highlightedDates, setHighlightedDates] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  useEffect(() => {
    if (matchStatus === 'idle') dispatch(fetchMatches({ includeDrafts: true, limit: 500 }));
  }, [matchStatus, dispatch]);

  useEffect(() => {
    let active = true;
    setCalendarLoading(true);
    fetchPublicFightCalendar({ includeDrafts: true, limit: 500 })
      .then((rows) => {
        if (active) setCalendarMatches(Array.isArray(rows) ? rows : []);
      })
      .catch((error) => {
        console.warn('Public fight calendar unavailable:', error.message);
        if (active) setCalendarMatches([]);
      })
      .finally(() => {
        if (active) setCalendarLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    fetchCalendarNewsEvents()
      .then((rows) => {
        if (active) setCalendarNewsEvents(Array.isArray(rows) ? rows : []);
      })
      .catch((error) => {
        console.warn('Fight news calendar mapping unavailable:', error.message);
        if (active) setCalendarNewsEvents([]);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    setHighlightedDates(new Set(allCalendarItems.map((match) => formatDateKey(match?.matchDate || match?.date || match?.scheduledAt)).filter(Boolean)));
  }, [allCalendarItems]);

  const matchesByDate = useMemo(() => allCalendarItems.reduce((map, match) => {
    const key = formatDateKey(match?.matchDate || match?.date || match?.scheduledAt);
    if (!key) return map;
    const existing = map.get(key) || [];
    existing.push(match);
    map.set(key, existing);
    return map;
  }, new Map()), [allCalendarItems]);

  const getDateHoverTitle = (tileDate) => {
    const rows = matchesByDate.get(formatDateKey(tileDate)) || [];
    if (!rows.length) return '';
    return rows.slice(0, 4).map((match) => {
      const title = getCalendarTitle(match);
      return isCalendarNewsEvent(match)
        ? `News — ${title}`
        : `${formatTime(match?.matchTime)} — ${title}`;
    }).join('\n');
  };

  const upcomingCount = useMemo(() => {
    const today = formatDateKey(new Date());
    return allCalendarItems.filter((match) => formatDateKey(match?.matchDate) >= today).length;
  }, [allCalendarItems]);

  const currentMonthCount = useMemo(() => allCalendarItems.filter((match) => {
    const matchDate = new Date(match?.matchDate);
    return !Number.isNaN(matchDate.getTime())
      && matchDate.getMonth() === viewDate.getMonth()
      && matchDate.getFullYear() === viewDate.getFullYear();
  }).length, [allCalendarItems, viewDate]);

  const newsEventCount = calendarNewsEvents.length;

  const handleDateChange = (selectedDate) => {
    setDate(selectedDate);
    const formattedDate = formatDateKey(selectedDate);
    const filteredMatches = allCalendarItems.filter((match) => formatDateKey(match?.matchDate) === formattedDate);
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
              provided by the production match feed. Dated fight-news events are mapped into the same calendar.
            </p>
          </div>
          <div className="premium-calendar-phase-two-stats">
            <article><FaFistRaised /><strong>{calendarLoading ? '—' : safeMatches.length}</strong><span>Total fights</span></article>
            <article><FaTrophy /><strong>{upcomingCount}</strong><span>Upcoming items</span></article>
            <article><FaCalendarAlt /><strong>{currentMonthCount}</strong><span>This month</span></article>
            <article><FaNewspaper /><strong>{newsEventCount}</strong><span>News events</span></article>
          </div>
        </header>

        <div className="premium-calendar-phase-two-layout">
          <aside className="premium-calendar-phase-two-art">
            <div>
              <span><FaShieldAlt /> Live schedule data</span>
              <h3>Plan your predictions before the bell.</h3>
              <p>Highlighted dates contain fight cards or dated fight-news events. Select a day to open the event list.</p>
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
              tileClassName={({ date: tileDate, view }) => {
                if (view !== 'month') return null;
                const rows = matchesByDate.get(formatDateKey(tileDate)) || [];
                if (!rows.length && !highlightedDates.has(formatDateKey(tileDate))) return null;
                const hasNews = rows.some(isCalendarNewsEvent);
                const hasFights = rows.some((row) => !isCalendarNewsEvent(row));
                return `premium-calendar-highlighted${hasNews ? ' has-news-event' : ''}${hasFights ? ' has-fight-event' : ''}`;
              }}
              tileContent={({ date: tileDate, view }) => {
                if (view !== 'month') return null;
                const rows = matchesByDate.get(formatDateKey(tileDate)) || [];
                if (!rows.length) return null;
                const hasNews = rows.some(isCalendarNewsEvent);
                const hasFights = rows.some((row) => !isCalendarNewsEvent(row));
                return (
                  <span
                    className={`premium-calendar-day-dot${hasNews ? ' has-news-event' : ''}${hasFights ? ' has-fight-event' : ''}`}
                    title={getDateHoverTitle(tileDate)}
                  >
                    {rows.length}
                  </span>
                );
              }}
              showNavigation={false}
            />

            <div className="premium-calendar-phase-two-legend">
              <span><i /> Fight card scheduled</span>
              <span><i className="is-news" /> News event mapped</span>
              <span>Select any highlighted date to inspect the item.</span>
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
              {selectedMatches.map((match, index) => {
                const isNewsEvent = isCalendarNewsEvent(match);
                return (
                  <button
                    type="button"
                    key={match?._id || index}
                    className={isNewsEvent ? 'is-news-event' : undefined}
                    onClick={() => openMatch(match)}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{getCalendarTitle(match)}</strong>
                      <small>
                        {isNewsEvent ? (
                          <>
                            <FaNewspaper /> News event · {match?.source || 'Fight news'}
                          </>
                        ) : (
                          <>
                            <FaClock /> {formatTime(match?.matchTime)} · <FaMapMarkerAlt /> {match?.venue || 'Venue TBA'}
                          </>
                        )}
                      </small>
                    </div>
                    <FaArrowRight />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {modalVisible && currentMatch && (
        <div className="premium-calendar-modal-backdrop" onClick={closeMatch}>
          <div className={`premium-calendar-modal is-fight-detail${isCalendarNewsEvent(currentMatch) ? ' is-news-detail' : ''}`} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="premium-calendar-modal-close" onClick={closeMatch}><FaTimes /></button>
            <p className="xp-eyebrow">
              {isCalendarNewsEvent(currentMatch) ? <FaNewspaper /> : <FaFistRaised />}
              {isCalendarNewsEvent(currentMatch) ? ' News event' : ' Fight details'}
            </p>
            <h2>{getCalendarTitle(currentMatch)}</h2>
            <p>{currentMatch.matchDescription || 'Fight-card details are provided by the existing match feed.'}</p>
            {isCalendarNewsEvent(currentMatch) ? (
              <div className="premium-calendar-news-detail">
                <span><FaNewspaper /> {currentMatch.source || 'Fight news'}</span>
                {currentMatch.link && (
                  <a href={currentMatch.link} target="_blank" rel="noopener noreferrer">
                    Open full report <FaArrowRight />
                  </a>
                )}
              </div>
            ) : (
              <div className="premium-calendar-fighter-pair">
                <figure><img src={currentMatch.fighterAImage || '/images/fmm-experience/fighter-jadden-addison.webp'} alt={currentMatch.matchFighterA || 'Fighter A'} /><figcaption>{currentMatch.matchFighterA || 'Fighter A'}</figcaption></figure>
                <span>VS</span>
                <figure><img src={currentMatch.fighterBImage || '/images/fmm-experience/fighter-zaveer-davis.webp'} alt={currentMatch.matchFighterB || 'Fighter B'} /><figcaption>{currentMatch.matchFighterB || 'Fighter B'}</figcaption></figure>
              </div>
            )}
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
