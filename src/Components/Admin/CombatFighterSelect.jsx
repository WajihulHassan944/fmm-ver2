import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaSearch, FaSyncAlt, FaUserPlus } from 'react-icons/fa';
import OptimizedImage from '@/Components/Common/OptimizedImage';
import { combatFightersApi, getCombatFighterId, getCombatFighterImage, getCombatFighterName } from '@/Utils/combatFightersApi';

const FALLBACK_IMAGE = '/images/fmm-experience/fighter-action-red.webp';
const BLUE_FALLBACK_IMAGE = '/images/fmm-experience/fighter-action-blue.webp';

const findById = (items, id) => items.find((item) => String(getCombatFighterId(item)) === String(id));

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
  const [fighters, setFighters] = useState([]);
  const rootRef = useRef(null);

  const selected = useMemo(() => findById(fighters, value), [fighters, value]);

  const loadFighters = async (term = search) => {
    setLoading(true);
    try {
      const payload = await combatFightersApi.list({
        limit: 100,
        search: term,
        ...(category ? { category } : {}),
      });
      const rows = Array.isArray(payload?.items) ? payload.items : [];
      setFighters((current) => {
        const map = new Map([...current, ...rows].map((item) => [String(getCombatFighterId(item)), item]));
        return Array.from(map.values());
      });
    } catch (error) {
      console.warn('Unable to load combat fighters:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFighters('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const visibleFighters = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return fighters;
    return fighters.filter((fighter) => [
      getCombatFighterName(fighter),
      fighter.normalizedName,
      fighter.category,
      ...(fighter.aliases || []),
    ].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [fighters, search]);

  const selectFighter = (fighter) => {
    onChange?.(fighter);
    setOpen(false);
  };

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
          <small>{selected ? `${selected.category || 'combat'} · ${selected.status || 'active'}` : helper || 'Name and image are pulled from the fighter library'}</small>
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
                  loadFighters(search);
                }
              }}
              placeholder="Search fighter name"
              autoFocus
            />
            <button type="button" onClick={() => loadFighters(search)} aria-label="Refresh fighter search">
              <FaSyncAlt className={loading ? 'xp-spin' : ''} />
            </button>
          </label>

          <div className="admin-fighter-select-list">
            {visibleFighters.length ? visibleFighters.map((fighter) => {
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
            }) : (
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
