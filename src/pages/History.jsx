import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { GENRE_COLORS } from '../constants';
import { SmartPoster } from '../components/SmartPoster';
import { AppHeader } from '../components/AppHeader';
import { SlidersHorizontal, X, Ticket } from 'lucide-react';

// ── CUSTOM ASSETS ────────────────────────────────────────────────────────────

const ChubbyHeart = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CapucinePill = ({ className = "" }) => (
  <div className={`flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 w-fit ${className}`}>
    <img src="https://i.imgur.com/lg1bkrO.png" className="w-3 h-3 object-contain" alt="Capucines" />
    <span className="text-[9px] font-black uppercase tracking-wider text-[#800020]">Capucines</span>
  </div>
);

const FavoriPill = ({ className = "" }) => (
  <div className={`flex items-center gap-1.5 bg-[var(--theme-accent)] px-3 py-1 rounded-full shadow-sm w-fit ${className}`}>
    <ChubbyHeart className="w-3 h-3 text-[var(--theme-bg)]" />
    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--theme-bg)]">Favori</span>
  </div>
);

// ── UI SUB-COMPONENTS ─────────────────────────────────────────────────────────

function FeatureCard({ film, onClick }) {
  const noteDisplay = film.note ? String(film.note).replace(',', '.') : null;

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
        <div className="flex flex-col gap-2 items-start">
          {film.coupDeCoeur && <FavoriPill />}
          {film.capucine && <CapucinePill />}
        </div>

        {film.numero && (
          <span className="bg-black/20 backdrop-blur-md border border-white/10 text-white/90 text-[10px] font-black px-3 py-1.5 rounded-full tracking-[0.2em] uppercase">
            #{film.numero}
          </span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 pt-20">
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1">
            {film.genre && (
              <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border mb-3 ${GENRE_COLORS[film.genre] || 'border-white/20 text-white/60'}`}>
                {film.genre}
              </span>
            )}

            <h3 className="font-galinoy text-white text-5xl italic leading-[0.85] drop-shadow-lg">
              {film.titre}
            </h3>

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mt-3 block">
              {film.date}
            </span>
          </div>

          {noteDisplay && (
            <div className="flex-shrink-0 mb-1">
              <span className="font-galinoy text-7xl italic leading-none text-white drop-shadow-xl">
                {noteDisplay}
              </span>
            </div>
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
        <div className="relative w-16 h-22 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-sm">
          <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-1.5 mb-1.5">
            {film.numero && (
              <span className="text-[9px] font-black text-[var(--theme-text)] opacity-30 tracking-widest">
                #{film.numero}
              </span>
            )}
            <p className="font-galinoy text-2xl leading-tight text-[var(--theme-text)]">
              {film.titre}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] opacity-60">{film.date}</span>
            <div className="flex items-center gap-2">
              {film.capucine && <img src="https://i.imgur.com/lg1bkrO.png" className="w-3 h-3 object-contain" alt="Capucines" />}
              {film.coupDeCoeur && <ChubbyHeart className="w-3.5 h-3.5 text-[var(--theme-accent)]" />}
              <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium">
                {film.genre}
              </span>
            </div>
          </div>
        </div>

        {noteDisplay && (
          <div className="pl-2 flex-shrink-0">
            <div className="font-galinoy text-3xl italic text-[var(--theme-text-secondary)] opacity-40">
              {noteDisplay}
            </div>
          </div>
        )}
      </div>
      {showSeparator && <div className="h-px bg-[var(--theme-border)] mx-2 opacity-30" />}
    </div>
  );
}

function FilterSheet({ isOpen, onClose, activeYear, setActiveYear, activeType, setActiveType, availableYears, onReset }) {
  if (!isOpen) return null;
  const types = [
    { id: 'all',      label: 'Tout'      },
    { id: 'coeur',    label: 'Favoris'   },
    { id: 'capucine', label: 'Capucines' },
    { id: 'top',      label: 'Top'       },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full rounded-t-[3rem] bg-[var(--theme-surface)] border-x border-t border-[var(--theme-border)] animate-in slide-in-from-bottom duration-300 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-[var(--theme-text)] opacity-10" />
        </div>
        <div className="px-8 pt-6 space-y-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-[var(--theme-text)] opacity-30">Filtrer par</p>
            <div className="flex flex-wrap gap-2">
              {types.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveType(id)}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${activeType === id ? 'bg-[var(--theme-accent)] text-[var(--theme-bg)] border-transparent' : 'bg-transparent text-[var(--theme-text)] border-[var(--theme-border)] opacity-60'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-[var(--theme-text)] opacity-30">Année</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveYear('all')}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${activeYear === 'all' ? 'bg-[var(--theme-accent)] text-[var(--theme-bg)] border-transparent' : 'bg-transparent text-[var(--theme-text)] border-[var(--theme-border)] opacity-60'}`}
              >
                Tout
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setActiveYear(year)}
                  className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${activeYear === year ? 'bg-[var(--theme-accent)] text-[var(--theme-bg)] border-transparent' : 'bg-transparent text-[var(--theme-text)] border-[var(--theme-border)] opacity-60'}`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => { onReset(); onClose(); }}
            className="w-full py-4 rounded-2xl border border-[var(--theme-border)] text-[11px] font-black uppercase tracking-widest text-[var(--theme-text)] opacity-40"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN HISTORY ──────────────────────────────────────────────────────────────

export function History({ historyData = [], setSelectedFilm, displayCount, scrollY = 0 }) {
  const [activeType,     setActiveType]     = useState('all');
  const [activeYear,     setActiveYear]     = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [isSearchOpen,   setIsSearchOpen]   = useState(false);
  const [isFilterOpen,   setIsFilterOpen]   = useState(false);

  // ── IntersectionObserver: track which month heading is in view ────────────
  // We store refs to each month section's heading element in a Map keyed by
  // the month string so the observer callback can identify them.
  const [currentMonth,    setCurrentMonth]    = useState('');
  const monthHeadingRefs  = useRef(new Map());   // key: monthKey, value: DOM element
  const observerRef       = useRef(null);

  // Derived booleans
  const scrolled        = scrollY > 20;
  const hasActiveFilters = activeType !== 'all' || activeYear !== 'all';

  // ── Year list ─────────────────────────────────────────────────────────────
  const anneesDisponibles = useMemo(() => [
    ...new Set(historyData.map(f => f.date?.split('/')[2]).filter(Boolean))
  ].sort((a, b) => b - a), [historyData]);

  // ── Filtered + sorted data ────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let data = historyData.filter(f =>
      !searchQuery || f.titre.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeType === 'coeur')    data = data.filter(f => f.coupDeCoeur);
    if (activeType === 'capucine') data = data.filter(f => f.capucine);
    if (activeType === 'top')      data = data.filter(f => {
      const val = parseFloat(String(f.note || 0).replace(',', '.'));
      return val >= 4;
    });
    if (activeYear !== 'all')      data = data.filter(f => f.date?.endsWith(activeYear));

    return data.sort((a, b) => {
      const p = (d) => {
        const [dd, mm, yy] = d.split('/').map(Number);
        return new Date(yy, mm - 1, dd);
      };
      return p(b.date) - p(a.date);
    });
  }, [historyData, activeType, activeYear, searchQuery]);

  // ── Group by month ────────────────────────────────────────────────────────
  const groupedByMonth = useMemo(() => {
    const groups = {};
    filteredData.slice(0, displayCount).forEach(film => {
      const parts = film.date.split('/');
      const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(
        new Date(parts[2], parseInt(parts[1]) - 1)
      );
      const key = `${monthName} ${parts[2]}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(film);
    });
    return Object.entries(groups);
  }, [filteredData, displayCount]);

  // ── Set up IntersectionObserver whenever groupedByMonth changes ───────────
  // Strategy: observe each month heading. The topmost one that has crossed
  // into the viewport (intersecting OR above the fold) is the "current" one.
  // We use a rootMargin that fires as soon as the heading scrolls under the
  // header (~80px from the top).
  const registerMonthHeading = useCallback((monthKey, node) => {
    if (node) {
      monthHeadingRefs.current.set(monthKey, node);
    } else {
      monthHeadingRefs.current.delete(monthKey);
    }
  }, []);

  useEffect(() => {
    // Disconnect any previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // We need at least one heading to observe
    if (monthHeadingRefs.current.size === 0) return;

    // Keep a local map of which headings are currently "above or at" the
    // viewport top, then pick the last one (most recently scrolled past).
    const visibilityMap = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // Find the monthKey for this element
          for (const [key, el] of monthHeadingRefs.current.entries()) {
            if (el === entry.target) {
              // Mark as visible if intersecting, or if above the root (boundingClientRect.top < 0)
              const isAboveOrAt =
                entry.isIntersecting ||
                entry.boundingClientRect.top < 0;
              visibilityMap.set(key, isAboveOrAt);
              break;
            }
          }
        });

        // The "current" month is the last key in groupedByMonth order
        // that is either intersecting or has been scrolled past.
        const monthKeys = groupedByMonth.map(([key]) => key);
        let candidate = '';
        for (const key of monthKeys) {
          if (visibilityMap.get(key)) {
            candidate = key;
          }
        }
        if (candidate) setCurrentMonth(candidate);
      },
      {
        // rootMargin: fire when the heading is 80px below the top of the
        // viewport (just below the header), with no bottom threshold.
        rootMargin: '-80px 0px 0px 0px',
        threshold: [0, 1],
      }
    );

    for (const el of monthHeadingRefs.current.values()) {
      observer.observe(el);
    }

    observerRef.current = observer;

    // Cleanup on unmount or when groupedByMonth changes
    return () => {
      observer.disconnect();
    };
  }, [groupedByMonth]);

  // ── Subtitle for AppHeader ────────────────────────────────────────────────
  // Only show the month subtitle once the user has scrolled past the hero title.
  const headerSubtitle = scrolled && currentMonth ? currentMonth : undefined;

  // ── Right slot buttons ────────────────────────────────────────────────────
  const rightSlot = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsFilterOpen(true)}
        className={`relative w-11 h-11 rounded-full flex items-center justify-center border transition-all active:scale-90 shadow-sm ${
          hasActiveFilters
            ? 'bg-[var(--theme-accent)] border-transparent text-[var(--theme-bg)]'
            : 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)]'
        }`}
        aria-label="Filtrer"
      >
        <SlidersHorizontal size={16} />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[var(--theme-bg)]" />
        )}
      </button>

      <button
        onClick={() => setIsSearchOpen(true)}
        className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-sm active:scale-90 text-[var(--theme-text)] transition-all"
        aria-label="Rechercher"
      >
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-outfit">

      {/* ── GLOBAL HEADER ──────────────────────────────────────────────── */}
      <AppHeader
        title="Journal"
        subtitle={headerSubtitle}
        scrolled={scrolled}
        rightSlot={rightSlot}
      />

      {/*
        ── CONTENT ──────────────────────────────────────────────────────────
        Top padding clears the fixed AppHeader.
        We use the CSS var --header-height if defined, with a sensible
        fallback. The large padding-top on the first child handles the
        "hero" spacing when not scrolled.
      */}
      <main
        className="px-5 pb-24"
        style={{ paddingTop: 'var(--header-height, 5rem)' }}
      >
        {groupedByMonth.length === 0 ? (
          <div className="py-32 text-center opacity-20">
            <Ticket size={48} className="mx-auto mb-4" />
            <p className="font-galinoy text-4xl italic">Vide</p>
          </div>
        ) : (
          groupedByMonth.map(([month, films], groupIdx) => (
            <section key={month} className="mb-6">

              {/*
                ── MONTH HEADING ───────────────────────────────────────────
                No longer sticky on its own — the AppHeader subtitle now
                provides the "you are in month X" context while scrolling.
                We keep the heading visible in the flow as a clear visual
                separator between groups, but remove the sticky positioning.

                We attach the ref callback here so the IntersectionObserver
                can track when this heading scrolls into/out of the header.
              */}
              <div
                ref={(node) => registerMonthHeading(month, node)}
                className="py-5"
                data-month={month}
              >
                <h2 className="font-galinoy italic text-4xl capitalize tracking-tight text-[var(--theme-text)]">
                  {month}
                </h2>
              </div>

              {/* ── FILM ITEMS ──────────────────────────────────────────── */}
              <div className="mt-2">
                {films.map((film, idx) => {
                  const noteValue    = parseFloat(String(film.note).replace(',', '.'));
                  const isHighlighted = noteValue >= 4.5 || film.coupDeCoeur;

                  return isHighlighted ? (
                    <FeatureCard
                      key={idx}
                      film={film}
                      onClick={() => setSelectedFilm(film)}
                    />
                  ) : (
                    <StandardRow
                      key={idx}
                      film={film}
                      onClick={() => setSelectedFilm(film)}
                      showSeparator={
                        !!films[idx + 1] &&
                        !(
                          parseFloat(String(films[idx + 1].note).replace(',', '.')) >= 4.5 ||
                          films[idx + 1].coupDeCoeur
                        )
                      }
                    />
                  );
                })}
              </div>

            </section>
          ))
        )}
      </main>

      {/* ── SEARCH OVERLAY ───────────────────────────────────────────────── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[400] bg-[var(--theme-bg)] p-8 pt-[env(safe-area-inset-top)] animate-in fade-in zoom-in-95 duration-200 flex flex-col">
          <div className="flex justify-end mb-12 mt-4">
            <button
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--theme-surface)] border border-[var(--theme-border)]"
              aria-label="Fermer la recherche"
            >
              <X size={24} />
            </button>
          </div>
          <input
            autoFocus
            className="w-full bg-transparent py-6 font-galinoy text-6xl italic outline-none border-b-2 border-[var(--theme-accent)] text-[var(--theme-text)] placeholder:opacity-10"
            placeholder="Rechercher…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* ── FILTER SHEET ─────────────────────────────────────────────────── */}
      <FilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        activeYear={activeYear}
        setActiveYear={setActiveYear}
        activeType={activeType}
        setActiveType={setActiveType}
        availableYears={anneesDisponibles}
        onReset={() => { setActiveType('all'); setActiveYear('all'); }}
      />
    </div>
  );
}