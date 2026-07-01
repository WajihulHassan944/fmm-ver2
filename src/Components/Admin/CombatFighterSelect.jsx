import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaSearch, FaSyncAlt, FaUserPlus } from 'react-icons/fa';
import OptimizedImage from '@/Components/Common/OptimizedImage';
import { combatFightersApi, getCombatFighterId, getCombatFighterImage, getCombatFighterName } from '@/Utils/combatFightersApi';

const FALLBACK_IMAGE = '/images/fmm-experience/fighter-action-red.webp';
const BLUE_FALLBACK_IMAGE = '/images/fmm-experience/fighter-action-blue.webp';
const PAGE_SIZE = 25;

const findById = (items, id) => items.find((item) => String(getCombatFighterId(item)) === String(id));
const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.items || payload?.fighters || payload?.data || payload?.rows || [];
};
const getPagination = (payload = {}) => payload.pagination || payload.meta || {};

const mergeById = (current = [], rows = []) => {
  const map = new Map();
  [...current, ...rows].forEach((item) => {
    const id = getCombatFighterId(item);
    if (id) map.set(String(id), item);
  });
  return Array.from(map.values());
};

export default function CombatFighterSelect({
  label,
  value,
  onChange,
  side = 'A',
  category,
  disabled = false,
  required = false,
  helper,
}) {
  const fallback = side === 'B' ? BLUE_FALLBACK_IMAGE : FALLBACK_IMAGE;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fighters, setFighters] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, hasNextPage: false, nextPage: null, total: 0 });
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const requestRef = useRef(0);

  const selected = useMemo(() => findById(fighters, value), [fighters, value]);

  const loadFighters = useCallback(async ({ page = 1, term = '', append = false } = {}) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const payload = await combatFightersApi.list({
        page,
        limit: PAGE_SIZE,
        status: 'active',
        search: term,
        ...(category ? { category } : {}),
      });
      if (requestRef.current !== requestId) return;
      const rows = getRows(payload);
      setFighters((current) => (append ? mergeById(current, rows) : rows));
      const meta = getPagination(payload);
      setPagination({
        page: Number(meta.page || page),
        limit: Number(meta.limit || PAGE_SIZE),
        total: Number(meta.total || rows.length),
        pages: Number(meta.pages || 1),
        hasNextPage: Boolean(meta.hasNextPage || (meta.nextPage && Number(meta.nextPage) > Number(meta.page || page))),
        nextPage: meta.nextPage ?? null,
      });
    } catch (error) {
      console.warn('Unable to load combat fighters:', error.message);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    setSearch('');
    setPagination({ page: 1, hasNextPage: false, nextPage: null, total: 0 });
    loadFighters({ page: 1, term: '', append: false });
  }, [category, loadFighters]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => {
      loadFighters({ page: 1, term: search, append: false });
    }, 280);
    return () => clearTimeout(timer);
  }, [open, search, loadFighters]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const loadNextPage = useCallback(() => {
    if (loading || loadingMore || !pagination.hasNextPage || !pagination.nextPage) return;
    loadFighters({ page: pagination.nextPage, term: search, append: true });
  }, [loadFighters, loading, loadingMore, pagination.hasNextPage, pagination.nextPage, search]);

  const handleListScroll = (event) => {
    const node = event.currentTarget;
    const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (remaining < 72) loadNextPage();
  };

  const selectFighter = (fighter) => {
    onChange?.(fighter);
    setOpen(false);
  };

  const empty = !loading && fighters.length === 0;

  return (
    <div className={`admin-fighter-select ${open ? 'is-open' : ''}`} ref={rootRef}>
      <div className="admin-fighter-select-label">
        <span>{label}</span>
        {required ? <em>Required</em> : null}
      </div>
      <button
        type="button"
        className="admin-fighter-select-trigger"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
      >
        <OptimizedImage
          src={getCombatFighterImage(selected) || fallback}
          fallbackSrc={fallback}
          alt={selected ? getCombatFighterName(selected) : `${label} placeholder`}
          width={46}
          height={46}
          sizes="46px"
        />
        <span>
          <strong>{selected ? getCombatFighterName(selected) : 'Select fighter from library'}</strong>
          <small>{selected ? `${selected.category || 'combat'} · ${selected.status || 'active'}` : helper || 'Infinite-scroll fighter library with name and image'}</small>
        </span>
        <FaChevronDown aria-hidden="true" />
      </button>

      <input type="hidden" value={value || ''} readOnly required={required} />

      {open && (
        <div className="admin-fighter-select-menu">
          <label className="admin-fighter-select-search">
            <FaSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  loadFighters({ page: 1, term: search, append: false });
                }
              }}
              placeholder="Search fighter name"
              autoFocus
            />
            <button type="button" onClick={() => loadFighters({ page: 1, term: search, append: false })} aria-label="Refresh fighter search">
              <FaSyncAlt className={loading ? 'xp-spin' : ''} />
            </button>
          </label>

          <div className="admin-fighter-select-list" ref={listRef} onScroll={handleListScroll}>
            {fighters.map((fighter) => {
              const id = getCombatFighterId(fighter);
              return (
                <button
                  type="button"
                  key={id}
                  className={String(id) === String(value) ? 'is-selected' : ''}
                  onClick={() => selectFighter(fighter)}
                >
                  <OptimizedImage src={getCombatFighterImage(fighter) || fallback} fallbackSrc={fallback} alt={getCombatFighterName(fighter)} width={42} height={42} sizes="42px" />
                  <span><strong>{getCombatFighterName(fighter)}</strong><small>{fighter.category || 'combat'} · {fighter.primaryImage ? 'image ready' : 'needs image'}</small></span>
                </button>
              );
            })}

            {(loading || loadingMore) && (
              <div className="admin-fighter-select-loading"><FaSyncAlt className="xp-spin" /> {loadingMore ? 'Loading more fighters...' : 'Loading fighters...'}</div>
            )}

            {pagination.hasNextPage && !loadingMore && !loading && (
              <button type="button" className="admin-fighter-select-load-more" onClick={loadNextPage}>Load more fighters</button>
            )}

            {empty && (
              <div className="admin-fighter-select-empty">
                <FaUserPlus />
                <strong>No fighter found</strong>
                <small>Create/import this fighter in Fighter Library first.</small>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
