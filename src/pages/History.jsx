import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { GENRE_COLORS } from '../constants';
import { SmartPoster } from '../components/SmartPoster';
import { SlidersHorizontal, X, Ticket } from 'lucide-react';

/* ── Custom assets ─────────────────────────────────────────────────── */

const ChubbyHeart = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CapucinePill = () => (
  <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 w-fit">
    <img src="https://i.imgur.com/lg1bkrO.png" className="w-3 h-3 object-contain" alt="Capucines" />
    <span className="text-[9px] font-black uppercase tracking-wider text-[#800020]">Capucines</span>
  </div>
);

const FavoriPill = () => (
  <div className="flex items-center gap-1.5 bg-[#E14A4A] px-3 py-1 rounded-full shadow-sm w-fit">
    <ChubbyHeart className="w-3 h-3 text-white" />
    <span className="text-[9px] font-black uppercase text-white">Coup de cœur</span>
  </div>
);

/* ── Cards ─────────────────────────────────────────────────────────── */

function FeatureCard({ film, onClick, isHero = false }) {
  const noteDisplay = film.note ? String(film.note).replace(',', '.') : null;

  if (isHero) {
    return (
      <div
        onClick={onClick}
        className="relative overflow-hidden cursor-pointer active:scale-[0.995] transition-transform duration-300 group"
        style={{
          height: '62dvh',
          marginLeft: '-20px',
          marginRight: '-20px',
          marginBottom: '0',
          borderRadius: '0 0 2.5rem 2.5rem',
        }}
      >
        <SmartPoster
          afficheInitiale={film.affiche}
          titre={film.titre}
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" style={{ height: '40%' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div
          className="absolute left-6 right-6 flex justify-between items-start z-10"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 88px)' }}
        >
          <div className="flex flex-col gap-2">
            {film.coupDeCoeur && <FavoriPill />}
            {film.capucine && <CapucinePill />}
          </div>
          {film.numero && (
            <span className="bg-black/20 backdrop-blur-md border border-white/10 text-white/90 text-[10px] font-black px-3 py-1.5 rounded-full tracking-[0.2em]">
              #{film.numero}
            </span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8 pt-20">
          <div className="flex items-end justify-between gap-6">
            <div className="flex-1 min-w-0">
              {film.genre && (
                <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border mb-3 ${GENRE_COLORS[film.genre] || 'border-white/20 text-white/60'}`}>
                  {film.genre}
                </span>
              )}
              <h3 className="font-galinoy text-white text-2xl italic leading-[0.85]">{film.titre}</h3>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mt-3 block">{film.date}</span>
            </div>
            {noteDisplay && (
              <span className="font-galinoy text-2xl italic leading-none text-white flex-shrink-0">{noteDisplay}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="relative w-full rounded-[2.5rem] overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-500 mb-10 aspect-[4/3] shadow-2xl group"
    >
      <SmartPoster
        afficheInitiale={film.affiche}
        titre={film.titre}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent to-60%" />
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
        <div className="flex flex-col gap-2">
          {film.coupDeCoeur && <FavoriPill />}
          {film.capucine && <CapucinePill />}
        </div>
        {film.numero && (
          <span className="bg-black/20 backdrop-blur-md border border-white/10 text-white/90 text-[10px] font-black px-3 py-1.5 rounded-full tracking-[0.2em]">
            #{film.numero}
          </span>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-8 pt-20">
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1 min-w-0">
            {film.genre && (
              <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border mb-3 ${GENRE_COLORS[film.genre] || 'border-white/20 text-white/60'}`}>
                {film.genre}
              </span>
            )}
            <h3 className="font-galinoy text-white text-2xl italic leading-[0.85]">{film.titre}</h3>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mt-3 block">{film.date}</span>
          </div>
          {noteDisplay && (
            <span className="font-galinoy text-2xl italic leading-none text-white">{noteDisplay}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function StandardRow({ film, onClick, showSeparator }) {
  const noteDisplay = film.note ? String(film.note).replace(',', '.') : null;
  return (
    <div className="group">
      <div
        onClick={onClick}
        className="grid grid-cols-[auto_1fr_auto] items-center gap-5 py-5 px-2 pr-4 cursor-pointer active:bg-white/5 rounded-2xl transition-colors"
      >
        <div className="relative w-16 rounded-xl overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)]" style={{ height: '88px' }}>
          <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-black text-[var(--theme-text)] opacity-30 tracking-widest block mb-1">
            #{film.numero}
          </span>
          <p className="font-galinoy text-lg leading-tight text-[var(--theme-text)]">{film.titre}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] opacity-60">{film.date}</span>
            <div className="flex items-center gap-2">
              {film.capucine && <img src="https://i.imgur.com/lg1bkrO.png" className="w-3 h-3 object-contain" alt="" />}
              {film.coupDeCoeur && <ChubbyHeart className="w-3.5 h-3.5 text-[var(--theme-accent)]" />}
              <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium">{film.genre}</span>
            </div>
          </div>
        </div>
        {noteDisplay && (
          <div className="font-galinoy text-3xl italic text-[var(--theme-text-secondary)] opacity-40 pr-2">
            {noteDisplay}
          </div>
        )}
      </div>
      {showSeparator && <div className="h-px bg-[var(--theme-border)] mx-2 opacity-30" />}
    </div>
  );
}

/* ── Filter Drawer ─────────────────────────────────────────────────── */

const FILTER_DEFS = [
  {
    id: 'coeur',
    label: 'Coup de cœur',
    icon: (active) => <ChubbyHeart className={`w-3.5 h-3.5 transition-colors duration-200 ${active ? 'text-[#E14A4A]' : 'text-white/30'}`} />,
  },
  {
    id: 'capucine',
    label: 'Capucines',
    icon: (active) => (
      <img
        src="https://i.imgur.com/lg1bkrO.png"
        className={`w-3.5 h-3.5 object-contain transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-30'}`}
        alt=""
      />
    ),
  },
  {
    id: 'note4',
    label: '≥ 4 étoiles',
    icon: (active) => (
      <svg viewBox="0 0 16 16" fill="currentColor" className={`w-3.5 h-3.5 transition-colors duration-200 ${active ? 'text-amber-400' : 'text-white/30'}`}>
        <path d="M8 1l1.85 3.75 4.15.6-3 2.92.71 4.13L8 10.25l-3.71 1.95.71-4.13-3-2.92 4.15-.6z" />
      </svg>
    ),
  },
];

function FilterToggle({ def, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-3 w-full py-3.5 transition-all duration-200 active:scale-[0.98]"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Left icon */}
      <span className="flex-shrink-0 w-6 flex items-center justify-center">
        {def.icon(active)}
      </span>

      {/* Label */}
      <span
        className="flex-1 text-left font-outfit text-[14px] transition-all duration-200"
        style={{
          color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.42)',
          fontWeight: active ? 600 : 400,
          letterSpacing: active ? '-0.01em' : '0',
        }}
      >
        {def.label}
      </span>

      {/* Count badge */}
      {count !== undefined && count > 0 && (
        <span
          className="text-[11px] font-medium transition-all duration-200 mr-3"
          style={{ color: active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)' }}
        >
          {count}
        </span>
      )}

      {/* Toggle pill */}
      <div
        className="flex-shrink-0 relative transition-all duration-300 ease-out"
        style={{
          width: '38px',
          height: '22px',
          borderRadius: '11px',
          background: active
            ? 'var(--theme-accent, rgba(255,255,255,0.9))'
            : 'rgba(255,255,255,0.08)',
          border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        <div
          className="absolute top-[3px] transition-all duration-300 ease-out"
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: active ? '#000' : 'rgba(255,255,255,0.3)',
            left: active ? '21px' : '3px',
          }}
        />
      </div>
    </button>
  );
}

function YearToggle({ year, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 transition-all duration-200 active:scale-95"
      style={{
        padding: '8px 14px',
        borderRadius: '20px',
        background: active ? 'var(--theme-accent, rgba(255,255,255,0.9))' : 'transparent',
        border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        className="font-outfit text-[13px] leading-none transition-all duration-200"
        style={{
          color: active ? '#000' : 'rgba(255,255,255,0.45)',
          fontWeight: active ? 700 : 400,
        }}
      >
        {year}
      </span>
      {count !== undefined && (
        <span
          className="ml-1.5 font-outfit text-[10px] transition-all duration-200"
          style={{ color: active ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.2)' }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function FilterDrawer({
  isOpen,
  onClose,
  activeTypes,
  toggleType,
  activeYears,
  toggleYear,
  availableYears,
  yearCounts,
  typeCounts,
  totalActive,
  onReset,
}) {
  const dragRef = useRef({ startY: 0, currentY: 0, dragging: false });
  const sheetRef = useRef(null);

  const handleTouchStart = (e) => {
    dragRef.current = { startY: e.touches[0].clientY, currentY: 0, dragging: true };
  };
  const handleTouchMove = (e) => {
    if (!dragRef.current.dragging) return;
    const dy = Math.max(0, e.touches[0].clientY - dragRef.current.startY);
    dragRef.current.currentY = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      sheetRef.current.style.transition = 'none';
    }
  };
  const handleTouchEnd = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 300ms cubic-bezier(0.32,0.72,0,1)';
    }
    if (dragRef.current.currentY > 72) {
      onClose();
    } else {
      if (sheetRef.current) sheetRef.current.style.transform = 'translateY(0)';
    }
  };

  // Reset transform when reopened
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
      sheetRef.current.style.transition = '';
    }
  }, [isOpen]);

  return (
    <>
      <style>{`
        @keyframes fd-backdrop-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fd-backdrop-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes fd-sheet-in     { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes fd-sheet-out    { from { transform: translateY(0) }    to { transform: translateY(100%) } }

        .fd-backdrop-enter { animation: fd-backdrop-in  220ms ease forwards; }
        .fd-backdrop-exit  { animation: fd-backdrop-out 240ms ease forwards; }
        .fd-sheet-enter    { animation: fd-sheet-in  320ms cubic-bezier(0.32,0.72,0,1) forwards; }
        .fd-sheet-exit     { animation: fd-sheet-out 260ms cubic-bezier(0.4,0,1,1) forwards; }
      `}</style>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[300] ${isOpen ? 'pointer-events-auto fd-backdrop-enter' : 'pointer-events-none fd-backdrop-exit'}`}
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed bottom-0 left-0 right-0 z-[301] ${isOpen ? 'fd-sheet-enter' : 'fd-sheet-exit'}`}
        style={{
          borderRadius: '28px 28px 0 0',
          background: 'rgba(14,14,18,0.82)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)',
          willChange: 'transform',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3.5 pb-1">
          <div className="w-8 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-4">
          <div className="flex items-baseline gap-2.5">
            <span className="font-galinoy italic text-[18px] text-white/80 tracking-tight">Filtres</span>
            {totalActive > 0 && (
              <span
                className="font-outfit text-[11px] font-semibold transition-all duration-200"
                style={{ color: 'var(--theme-accent, rgba(255,255,255,0.5))' }}
              >
                {totalActive} actif{totalActive > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 mb-2" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Filter toggles */}
        <div className="px-6 pb-2">
          {FILTER_DEFS.map((def, i) => (
            <React.Fragment key={def.id}>
              <FilterToggle
                def={def}
                active={activeTypes.has(def.id)}
                count={typeCounts[def.id]}
                onClick={() => toggleType(def.id)}
              />
              {i < FILTER_DEFS.length - 1 && (
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', marginLeft: '30px' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-6 my-3" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Year row */}
        <div className="px-6">
          <p
            className="font-outfit text-[10px] uppercase tracking-[0.18em] mb-3"
            style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}
          >
            Année
          </p>
          <div className="flex flex-wrap gap-2">
            {availableYears.map(y => (
              <YearToggle
                key={y}
                year={y}
                active={activeYears.has(y)}
                count={yearCounts[y]}
                onClick={() => toggleYear(y)}
              />
            ))}
          </div>
        </div>

        {/* Reset */}
        {totalActive > 0 && (
          <>
            <div className="mx-6 my-4" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <div className="px-6">
              <button
                onClick={() => { onReset(); onClose(); }}
                className="w-full py-3 rounded-2xl font-outfit text-[12px] font-medium transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.02em',
                }}
              >
                Effacer les filtres
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ── Inline search bar ─────────────────────────────────────────────── */

function InlineSearchBar({ isOpen, searchQuery, setSearchQuery, onOpen, onClose }) {
  const inputRef = useRef(null);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const sharedPill = {
    height: '2.5rem',
    backgroundColor: 'rgba(0,0,0,0.30)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${isOpen ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.20)'}`,
    transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
  };

  /* ── État fermé : bouton rond parfait ── */
  if (!isOpen) {
    return (
      <button
        onClick={onOpen}
        className="flex-shrink-0 flex items-center justify-center active:scale-90 transition-transform"
        style={{
          ...sharedPill,
          width: '2.5rem',
          borderRadius: '50%',
          color: 'rgba(255,255,255,0.9)',
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    );
  }

  /* ── État ouvert : barre expandée ── */
  return (
    <div
      className="flex items-center gap-2"
      style={{
        ...sharedPill,
        borderRadius: '999px',
        width: '100%',
        paddingLeft: '0.75rem',
        paddingRight: '0.375rem',
        minWidth: 0,
      }}
    >
      <svg
        width="15" height="15"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
        style={{ flexShrink: 0, color: 'rgba(255,255,255,0.5)' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Rechercher…"
        className="bg-transparent outline-none font-outfit text-xs flex-1 min-w-0"
        style={{ color: 'rgba(255,255,255,0.9)' }}
      />
      <button
        onClick={() => { setSearchQuery(''); onClose(); }}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ── Header right ──────────────────────────────────────────────────── */

function HistoryHeaderRight({ isSearchOpen, searchQuery, setSearchQuery, totalActiveFilters, onSearchOpen, onSearchClose, onFilterOpen }) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        width: isSearchOpen ? '100%' : 'auto',
        transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
        justifyContent: 'flex-end',
        overflow: 'visible',
      }}
    >
      {!isSearchOpen && (
        <button
          onClick={onFilterOpen}
          className="relative flex-shrink-0 flex items-center justify-center active:scale-90 transition-transform"
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            color: totalActiveFilters > 0 ? 'var(--theme-accent)' : 'rgba(255,255,255,0.9)',
            background: 'rgba(0,0,0,0.30)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.20)',
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={16} strokeWidth={2.5} />
          {totalActiveFilters > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black px-1"
              style={{ background: 'var(--theme-accent)', color: '#000' }}
            >
              {totalActiveFilters}
            </span>
          )}
        </button>
      )}
      <InlineSearchBar
        isOpen={isSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpen={onSearchOpen}
        onClose={onSearchClose}
      />
    </div>
  );
}

/* ── Main History ──────────────────────────────────────────────────── */

export function History({
  historyData = [],
  setSelectedFilm,
  displayCount,
  scrollY = 0,
  onHeaderTitle,
  onHeaderRight,
}) {
  const [activeTypes, setActiveTypes] = useState(new Set());
  const [activeYears, setActiveYears] = useState(new Set());
  const [searchQuery,  setSearchQuery]  = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleType = useCallback((id) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleYear = useCallback((y) => {
    setActiveYears(prev => {
      const next = new Set(prev);
      next.has(y) ? next.delete(y) : next.add(y);
      return next;
    });
  }, []);

  const totalActiveFilters = activeTypes.size + activeYears.size;

  const handleSearchOpen  = useCallback(() => setIsSearchOpen(true),  []);
  const handleSearchClose = useCallback(() => setIsSearchOpen(false), []);
  const handleFilterOpen  = useCallback(() => setIsFilterOpen(true),  []);

  /* ── Available years ── */
  const availableYears = useMemo(() =>
    [...new Set(historyData.map(f => f.date?.split('/')[2]).filter(Boolean))].sort((a, b) => b - a),
  [historyData]);

  /* ── Counts (sur données non filtrées) ── */
  const typeCounts = useMemo(() => ({
    coeur:    historyData.filter(f => f.coupDeCoeur).length,
    capucine: historyData.filter(f => f.capucine).length,
    note4:    historyData.filter(f => parseFloat(String(f.note || 0).replace(',', '.')) >= 4).length,
  }), [historyData]);

  const yearCounts = useMemo(() => {
    const counts = {};
    historyData.forEach(f => {
      const y = f.date?.split('/')[2];
      if (y) counts[y] = (counts[y] || 0) + 1;
    });
    return counts;
  }, [historyData]);

  /* ── Filtered + sorted — logique AND stricte ── */
  const filteredData = useMemo(() => {
    let data = historyData;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(f => f.titre.toLowerCase().includes(q));
    }

    // Types : AND strict entre les filtres cochés
    if (activeTypes.has('coeur'))    data = data.filter(f => f.coupDeCoeur);
    if (activeTypes.has('capucine')) data = data.filter(f => f.capucine);
    if (activeTypes.has('note4'))    data = data.filter(f => parseFloat(String(f.note || 0).replace(',', '.')) >= 4);

    // Années : OR dans la sélection des années (si aucune = tout passe)
    if (activeYears.size > 0) {
      data = data.filter(f => {
        const y = f.date?.split('/')[2];
        return activeYears.has(y);
      });
    }

    return data.sort((a, b) => {
      const p = d => { const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd); };
      return p(b.date) - p(a.date);
    });
  }, [historyData, activeTypes, activeYears, searchQuery]);

  /* ── Grouped by month ── */
  const groupedByMonth = useMemo(() => {
    const groups = {};
    filteredData.slice(0, displayCount).forEach(film => {
      const parts = film.date.split('/');
      const name  = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(parts[2], parseInt(parts[1]) - 1));
      const key   = `${name} ${parts[2]}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(film);
    });
    return Object.entries(groups);
  }, [filteredData, displayCount]);

  /* ── Titre dynamique ── */
  useEffect(() => {
    const sentinels = document.querySelectorAll('[data-month-sentinel]');
    if (!sentinels.length) return;
    const firstMonth = sentinels[0].getAttribute('data-month-sentinel');
    let active = firstMonth;
    sentinels.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= 1) active = el.getAttribute('data-month-sentinel');
    });
    onHeaderTitle?.(active ? active.charAt(0).toUpperCase() + active.slice(1) : active);
  }, [scrollY, onHeaderTitle]);

  /* ── Header right ── */
  useEffect(() => {
    onHeaderRight?.(
      <HistoryHeaderRight
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalActiveFilters={totalActiveFilters}
        onSearchOpen={handleSearchOpen}
        onSearchClose={handleSearchClose}
        onFilterOpen={handleFilterOpen}
      />
    );
  }, [isSearchOpen, searchQuery, totalActiveFilters, onHeaderRight, handleSearchOpen, handleSearchClose, handleFilterOpen]);

  /* ── Render ── */
  return (
    <div className="bg-transparent text-[var(--theme-text)] font-outfit min-h-full overflow-x-hidden">
      {groupedByMonth.length === 0 ? (
        <div className="flex flex-col items-center justify-center opacity-20" style={{ paddingTop: 'var(--header-total-height, 96px)', minHeight: '60vh' }}>
          <Ticket size={48} className="mb-2" />
          <p className="font-galinoy text-4xl capitalize italic">
            {searchQuery ? 'Aucun résultat' : 'Vide'}
          </p>
        </div>
      ) : (
        groupedByMonth.map(([month, films], monthIdx) => {
          const isFirstMonth = monthIdx === 0;
          return (
            <section key={month} style={{ position: 'relative' }}>
              <div
                data-month-sentinel={month}
                style={{ position: 'absolute', top: 0, height: 0, visibility: 'hidden', pointerEvents: 'none' }}
                aria-hidden="true"
              />
              {!isFirstMonth && (
                <div className="px-5 pt-8 pb-3">
                  <p className="font-galinoy italic text-lg capitalize text-[var(--theme-text)] opacity-30 tracking-tight">
                    {month}
                  </p>
                </div>
              )}
              <div>
                {films.map((film, idx) => {
                  const isHighlighted = parseFloat(String(film.note).replace(',', '.')) >= 4.5 || film.coupDeCoeur;
                  const isHero        = isFirstMonth && idx === 0;
                  if (isHero) {
                    return <FeatureCard key={idx} film={film} onClick={() => setSelectedFilm(film)} isHero />;
                  }
                  return (
                    <div key={idx} className="px-5">
                      {isHighlighted ? (
                        <FeatureCard film={film} onClick={() => setSelectedFilm(film)} />
                      ) : (
                        <StandardRow
                          film={film}
                          onClick={() => setSelectedFilm(film)}
                          showSeparator={
                            !!films[idx + 1] &&
                            !(parseFloat(String(films[idx + 1].note).replace(',', '.')) >= 4.5 || films[idx + 1].coupDeCoeur)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }} />

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        activeTypes={activeTypes}
        toggleType={toggleType}
        activeYears={activeYears}
        toggleYear={toggleYear}
        availableYears={availableYears}
        yearCounts={yearCounts}
        typeCounts={typeCounts}
        totalActive={totalActiveFilters}
        onReset={() => { setActiveTypes(new Set()); setActiveYears(new Set()); }}
      />
    </div>
  );
}