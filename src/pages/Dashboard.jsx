import { useState, useEffect, useRef, useCallback } from 'react';
import { SmartPoster } from '../components/SmartPoster';

// ─────────────────────────────────────────────
// TMDB POSTER FETCH (fallback by title)
// ─────────────────────────────────────────────
const TMDB_API_KEY = '';
const tmdbPosterCache = {};

export async function fetchTMDBPosterByTitle(titre) {
  if (!titre) return null;
  if (tmdbPosterCache[titre] !== undefined) return tmdbPosterCache[titre];
  try {
    const query = encodeURIComponent(titre);
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}&language=fr-FR&page=1`
    );
    if (!res.ok) throw new Error('TMDB error');
    const data = await res.json();
    const first = data?.results?.[0];
    const path = first?.poster_path
      ? `https://image.tmdb.org/t/p/w500${first.poster_path}`
      : null;
    tmdbPosterCache[titre] = path;
    return path;
  } catch {
    tmdbPosterCache[titre] = null;
    return null;
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const parseDuration = (duree) => {
  if (!duree) return 110;
  const str = String(duree).toLowerCase().replace(/\s/g, '');
  if (str.includes('h')) {
    const parts = str.split('h');
    return (parseInt(parts[0], 10) * 60) + (parseInt(parts[1], 10) || 0);
  }
  const fallback = parseInt(str, 10);
  return isNaN(fallback) ? 110 : fallback;
};

const formatAvgDuration = (totalMins) => {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
};

const formatTotalTime = (totalMinutes) => {
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = totalMinutes / (60 * 24);
  const totalWeeks = totalDays / 7;
  const totalMonths = totalDays / 30.44;

  if (totalHours < 73) {
    return { value: totalHours, unit: totalHours === 1 ? 'heure' : 'heures' };
  } else if (totalDays < 8) {
    const d = Math.round(totalDays * 10) / 10;
    const dDisplay = Number.isInteger(d) ? d : d.toFixed(1).replace('.', ',');
    return { value: dDisplay, unit: d <= 1 ? 'jour' : 'jours' };
  } else if (totalWeeks < 6) {
    const w = Math.round(totalWeeks * 10) / 10;
    const wDisplay = Number.isInteger(w) ? w : w.toFixed(1).replace('.', ',');
    return { value: wDisplay, unit: w <= 1 ? 'semaine' : 'semaines' };
  } else {
    const mo = Math.round(totalMonths * 10) / 10;
    const moDisplay = Number.isInteger(mo) ? mo : mo.toFixed(1).replace('.', ',');
    return { value: moDisplay, unit: mo <= 1 ? 'mois' : 'mois' };
  }
};

const monthNames = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const formatPeriodLabel = (view, value) => {
  if (view === 'year') return value;
  if (view === 'month') {
    const [y, m] = value.split('-');
    return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
  }
  return 'Bilan Global';
};

const computeMetrics = (periodView, periodValue, historyData, pricing) => {
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonthIndex = now.getMonth();
  const availableYears = [...new Set(historyData.map((f) => f.date?.split('/')[2]).filter(Boolean))].sort((a, b) => b - a);

  const getPrice = (year, type) => {
    let p = pricing?.default?.[type] || (type === 'sub' ? 21.90 : 13.00);
    if (pricing?.[year]?.[type] !== undefined) p = pricing[year][type];
    return parseFloat(p) || 0;
  };

  const getMonthsToCharge = (y) => (y === currentYear ? currentMonthIndex + 1 : 12);

  const dashData = historyData.filter((film) => {
    if (!film.date) return false;
    if (periodView === 'year') return film.date.endsWith(periodValue);
    if (periodView === 'month') {
      const [y, m] = periodValue.split('-');
      if (!y || !m) return false;
      return film.date.endsWith(`${m}/${y}`);
    }
    return true;
  });

  const totalFilms = dashData.length;
  const notes = dashData.map((f) => parseFloat(String(f.note).replace(',', '.'))).filter((n) => !isNaN(n) && n > 0);
  const avgNote = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;

  const durations = dashData.map((f) => parseDuration(f.duree));
  const totalMinutes = durations.reduce((a, b) => a + b, 0);
  const avgDuration = durations.length > 0 ? Math.round(totalMinutes / durations.length) : 0;

  let vfCount = 0, voCount = 0;
  dashData.forEach((f) => {
    const l = (f.langue || 'VF').toUpperCase().trim();
    if (l === 'VF' || l === 'FRA' || l === 'VFQ') vfCount++;
    else voCount++;
  });

  const totalLang = vfCount + voCount;
  const voPct = totalLang > 0 ? Math.round((voCount / totalLang) * 100) : 0;
  const vfPct = 100 - voPct;

  const coupsDeCoeurCount = dashData.filter(f => {
    const isCoupDeCoeur = f.coupDeCoeur === true || f.coupDeCoeur === 'OUI' || f.coupDeCoeur === 1;
    const note = parseFloat(String(f.note || '0').replace(',', '.'));
    return isCoupDeCoeur || note >= 4.5;
  }).length;

  const totalStandardValue = dashData.reduce((acc, film) => acc + getPrice(film.date?.split('/')[2] || currentYear, 'ticket'), 0);
  let totalSubCost = 0;

  if (periodView === 'month') {
    const year = periodValue.split('-')[0];
    totalSubCost = getPrice(year, 'sub');
  } else if (periodView === 'year') {
    totalSubCost = getMonthsToCharge(periodValue) * getPrice(periodValue, 'sub');
  } else {
    availableYears.forEach((y) => { totalSubCost += getMonthsToCharge(y) * getPrice(y, 'sub'); });
  }

  const savings = totalStandardValue - totalSubCost;
  const costPerFilm = totalFilms > 0 ? totalSubCost / totalFilms : 0;

  return {
    totalFilms, avgNote, totalMinutes, avgDuration,
    voPct, vfPct, voCount, vfCount, coupsDeCoeurCount,
    totalStandardValue, totalSubCost, savings, costPerFilm,
    label: formatPeriodLabel(periodView, periodValue),
  };
};

// ─────────────────────────────────────────────
// CAPUCINES HELPERS
// Capucines selection runs June (month 6) through November (month 11)
// 6 films per month → 36 per year
// ─────────────────────────────────────────────
const CAPUCINES_MONTHS = [6, 7, 8, 9, 10, 11]; // June–November (1-indexed)
const CAPUCINES_PER_MONTH = 6;
const CAPUCINES_PER_YEAR = 36;

/**
 * Returns the total Capucines selection size for a given period.
 * - 'all'   → availableYears.length * 36
 * - 'year'  → 36
 * - 'month' → 6 if in Jun–Nov, else 0 (not a Capucines month)
 */
const getCapucinesTotalForPeriod = (periodView, periodValue, availableYears) => {
  if (periodView === 'all') return availableYears.length * CAPUCINES_PER_YEAR;
  if (periodView === 'year') return CAPUCINES_PER_YEAR;
  if (periodView === 'month') {
    const monthNum = parseInt(periodValue.split('-')[1], 10);
    return CAPUCINES_MONTHS.includes(monthNum) ? CAPUCINES_PER_MONTH : 0;
  }
  return CAPUCINES_PER_YEAR;
};

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
const ChubbyHeart = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

// ─────────────────────────────────────────────
// ANIMATED BAR
// ─────────────────────────────────────────────
function AnimatedBar({ pct, isAccent, height = 10 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div
      className="rounded-full overflow-hidden"
      style={{ height, backgroundColor: 'color-mix(in srgb, var(--theme-text) 10%, transparent)', width: '100%' }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          backgroundColor: isAccent ? 'var(--theme-accent)' : 'color-mix(in srgb, var(--theme-text) 55%, transparent)',
          transition: 'width 500ms ease-out',
          borderRadius: 'inherit',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// FOLDING DECK POSTERS — Effet jeu de cartes
//
// La vue par défaut présente les cartes déployées (faible superposition).
// Au scroll, chaque carte se déplace normalement vers la gauche jusqu'à 
// atteindre sa position "empilée". Une fois ce seuil atteint, un transform 
// compense le scroll pour la "verrouiller" dans la pile à gauche.
// ─────────────────────────────────────────────
function StackedPosters({ films, onSelectFilm }) {
  const CARD_W = 86;
  const CARD_H = 120;
  
  // Configuration de l'effet "Jeu de cartes"
  const DEPLOYED_GAP = 72; // Espacement initial (86 - 72 = 14px de superposition)
  const STACKED_GAP = 6;  // Espacement une fois dans la pile (les cartes sont presque totalement superposées)

  const scrollRef = useRef(null);
  const [scrollX, setScrollX] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollX(el.scrollLeft);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (!films.length) return null;

  // Largeur de base si les cartes restaient toutes déployées
  const totalContentWidth = CARD_W + (films.length - 1) * DEPLOYED_GAP;
  
  // On ajoute de l'espace de scroll supplémentaire (runway) pour permettre 
  // à l'utilisateur de scroller suffisamment pour replier jusqu'à la toute dernière carte.
  const maxThreshold = (films.length - 1) * (DEPLOYED_GAP - STACKED_GAP);
  const trackWidth = totalContentWidth + maxThreshold;

  return (
    <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 8, paddingTop: 8 }}>
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          height: CARD_H + 4,
          position: 'relative',
        }}
      >
        {/* Inner track — définit la zone de scroll totale */}
        <div style={{ position: 'relative', width: trackWidth, height: CARD_H, flexShrink: 0 }}>
          {films.map((film, i) => {
            // Position initiale (déployée)
            const baseLeft = i * DEPLOYED_GAP;
            
            // Position cible (empilée) relative au bord gauche
            const stackedLeft = i * STACKED_GAP;
            
            // Le scroll exact à partir duquel cette carte doit arrêter de bouger
            // vers la gauche et rejoindre la "pile"
            const threshold = baseLeft - stackedLeft;

            // Si le scroll dépasse le seuil, la carte commence à glisser avec le scroll 
            // pour rester figée visuellement dans la pile
            const offset = Math.max(0, scrollX - threshold);

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: baseLeft,
                  // L'utilisation de translate3d force l'accélération GPU pour une fluidité parfaite
                  transform: `translate3d(${offset}px, 0, 0)`,
                  top: 0,
                  zIndex: i + 1, // Les cartes de droite s'empilent au-dessus
                  width: CARD_W,
                  height: CARD_H,
                  willChange: 'transform',
                }}
              >
                <button
                  onClick={() => onSelectFilm(film)}
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    display: 'block',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '3px 3px 10px rgba(0,0,0,0.30)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <SmartPoster
                    afficheInitiale={film.affiche}
                    titre={film.titre}
                    className="w-full h-full object-cover pointer-events-none"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 36,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
                      borderBottomLeftRadius: 14,
                      borderBottomRightRadius: 14,
                      pointerEvents: 'none',
                    }}
                  >
                    {film.note && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 6,
                          left: 8,
                          fontSize: 11,
                          color: 'white',
                          fontFamily: 'Galinoy, serif',
                          fontStyle: 'italic',
                          lineHeight: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          maxWidth: CARD_W - 16,
                          display: 'block',
                        }}
                      >
                        {String(film.note).replace('.', ',')}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPARE SELECTOR SHEET
// ─────────────────────────────────────────────
function CompareSelector({ dashView, dashValue, availableYears, availableMonthsRaw, onConfirm, onClose }) {
  const [selections, setSelections] = useState([]);
  const isGlobal = dashView === 'all';
  const refLabel = formatPeriodLabel(dashView, dashValue);

  const candidatePeriods = dashView === 'year'
    ? availableYears.filter(y => y !== dashValue).map(y => ({ view: 'year', value: y, label: y }))
    : dashView === 'month'
      ? availableMonthsRaw.filter(m => m !== dashValue).map(m => ({ view: 'month', value: m, label: formatPeriodLabel('month', m) }))
      : [];

  const toggle = (value) => setSelections(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end mb-12">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--theme-surface)] w-full rounded-t-[24px] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-[var(--theme-border)] max-h-[75vh]"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

        <div className="w-10 h-1 bg-[var(--theme-text)] opacity-10 rounded-full self-center mt-4 mb-3" />

        <div className="px-6 mb-4">
          <h3 className="font-galinoy italic text-[var(--theme-text)] text-2xl leading-none">Comparer</h3>
          <p className="font-outfit text-[var(--theme-text)] opacity-60 text-[13px] mt-1">Sélectionne les périodes à mettre face à face.</p>
        </div>

        <div className="mx-6 mb-4 px-4 py-3 rounded-xl border border-[var(--theme-accent)]/40 bg-[var(--theme-accent)]/8 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--theme-accent)] flex-shrink-0" />
          <div>
            <p className="font-outfit text-[10px] text-[var(--theme-text)] opacity-50 uppercase tracking-widest">Période de référence</p>
            <p className="font-galinoy italic text-[var(--theme-accent)] text-lg leading-none mt-0.5">{refLabel}</p>
          </div>
        </div>

        {isGlobal ? (
          <div className="px-6 pb-8">
            <p className="font-outfit text-[var(--theme-text)] opacity-50 text-[14px] leading-relaxed">
              La comparaison n'est pas disponible en Bilan Global. Sélectionne une année ou un mois.
            </p>
          </div>
        ) : candidatePeriods.length === 0 ? (
          <div className="px-6 pb-8">
            <p className="font-outfit text-[var(--theme-text)] opacity-50 text-[14px]">Pas d'autres périodes disponibles.</p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto scrollbar-hide flex flex-col px-6 gap-2 mb-4 flex-1">
              {candidatePeriods.map(({ value, label }) => {
                const active = selections.includes(value);
                return (
                  <button key={value} onClick={() => toggle(value)}
                          className="flex items-center gap-3 py-3 px-4 rounded-xl text-left transition-all active:scale-[0.98]"
                          style={{
                            backgroundColor: active ? 'color-mix(in srgb, var(--theme-accent) 12%, transparent)' : 'color-mix(in srgb, var(--theme-text) 5%, transparent)',
                            border: active ? '1px solid color-mix(in srgb, var(--theme-accent) 40%, transparent)' : '1px solid transparent',
                          }}>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                         style={{ borderColor: active ? 'var(--theme-accent)' : 'color-mix(in srgb, var(--theme-text) 25%, transparent)', backgroundColor: active ? 'var(--theme-accent)' : 'transparent' }}>
                      {active && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="var(--theme-bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span className="font-outfit text-[var(--theme-text)] text-[15px]" style={{ opacity: active ? 1 : 0.6 }}>{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="px-6 pb-6 pt-2">
              <button onClick={() => selections.length > 0 && onConfirm(selections)}
                      disabled={selections.length === 0}
                      className="w-full py-3.5 font-outfit text-[15px] font-bold rounded-full transition-all active:scale-95"
                      style={{
                        backgroundColor: selections.length > 0 ? 'var(--theme-accent)' : 'color-mix(in srgb, var(--theme-text) 10%, transparent)',
                        color: selections.length > 0 ? 'var(--theme-bg)' : 'color-mix(in srgb, var(--theme-text) 30%, transparent)',
                        cursor: selections.length > 0 ? 'pointer' : 'not-allowed',
                      }}>
                {selections.length === 0 ? 'Choisis une période' : `Comparer ${selections.length + 1} période${selections.length > 0 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPARE VIEW
// ─────────────────────────────────────────────
function CompareView({ allMetrics, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const colors = ['var(--theme-accent)', 'color-mix(in srgb, var(--theme-text) 55%, transparent)', 'color-mix(in srgb, var(--theme-text) 35%, transparent)'];
  const maxFilms = Math.max(...allMetrics.map(m => m.totalFilms), 1);
  const maxAvgDur = Math.max(...allMetrics.map(m => m.avgDuration), 1);

  const scores = allMetrics.map((m) => {
    let s = 0;
    if (m.totalFilms === Math.max(...allMetrics.map(x => x.totalFilms))) s++;
    if (m.avgNote === Math.max(...allMetrics.map(x => x.avgNote))) s++;
    if (m.costPerFilm === Math.min(...allMetrics.filter(x => x.costPerFilm > 0).map(x => x.costPerFilm))) s++;
    if (m.coupsDeCoeurCount === Math.max(...allMetrics.map(x => x.coupsDeCoeurCount))) s++;
    return s;
  });

  const winnerIdx = scores.indexOf(Math.max(...scores));
  const winner = allMetrics[winnerIdx];

  const Divider = () => <div className="h-px mx-6" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-border) 30%, transparent)' }} />;
  const SectionTitle = ({ children }) => <p className="font-outfit text-[var(--theme-text)] opacity-60 text-[13px] uppercase tracking-widest mb-5">{children}</p>;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ backgroundColor: 'var(--theme-bg)' }}>
      <div className="flex-shrink-0 px-6 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-4 border-b" style={{ borderColor: 'color-mix(in srgb, var(--theme-border) 20%, transparent)' }}>
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform flex-shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-text) 8%, transparent)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4L6 9l5 5" /></svg>
          </button>
          <div>
            <h2 className="font-galinoy italic text-[var(--theme-text)] text-2xl leading-none">Comparaison</h2>
            <p className="font-outfit text-[var(--theme-text)] opacity-40 text-[11px] mt-0.5">{allMetrics.map(m => m.label).join(' · ')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
        <div className="flex flex-col gap-12 pt-8">

          {/* Legend */}
          <div className="px-6 flex flex-wrap gap-x-5 gap-y-2">
            {allMetrics.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                <span className="font-outfit text-[var(--theme-text)] text-[12px]" style={{ opacity: i === 0 ? 1 : 0.55 }}>
                  {m.label}{i === 0 && <span className="opacity-40 ml-1">(réf.)</span>}
                </span>
              </div>
            ))}
          </div>

          <Divider />

          {/* Films vus */}
          <div className="px-6">
            <SectionTitle>Films vus</SectionTitle>
            {allMetrics.map((m, i) => (
              <div key={i} className="flex items-center gap-4 mb-4">
                <span className="font-galinoy italic text-[44px] leading-none w-14 text-right flex-shrink-0" style={{ color: colors[i] }}>{m.totalFilms}</span>
                <div className="flex-1 flex flex-col gap-1.5">
                  <AnimatedBar pct={mounted ? (m.totalFilms / maxFilms) * 100 : 0} isAccent={i === 0} />
                  <span className="font-outfit text-[11px] text-[var(--theme-text)] opacity-40">{m.label}</span>
                </div>
              </div>
            ))}
          </div>

          <Divider />

          {/* Note */}
          <div className="px-6">
            <SectionTitle>Note moyenne</SectionTitle>
            <div className="flex gap-3">
              {allMetrics.map((m, i) => {
                const isHighest = m.avgNote === Math.max(...allMetrics.map(x => x.avgNote));
                return (
                  <div key={i} className="flex-1 rounded-2xl px-3 py-4 flex flex-col items-center gap-1"
                       style={{ backgroundColor: 'color-mix(in srgb, var(--theme-text) 5%, transparent)', border: isHighest ? '1px solid color-mix(in srgb, var(--theme-accent) 40%, transparent)' : '1px solid transparent' }}>
                    <span className="font-galinoy italic text-[40px] leading-none" style={{ color: isHighest ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
                      {m.avgNote > 0 ? m.avgNote.toFixed(1).replace('.', ',') : '—'}
                    </span>
                    <span className="font-outfit text-[10px] text-[var(--theme-text)] opacity-40 text-center">{m.label}</span>
                    {isHighest && allMetrics.length > 1 && (
                      <div className="mt-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}>
                        <span className="font-outfit text-[9px]" style={{ color: 'var(--theme-accent)' }}>meilleure</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Divider />

          {/* Temps total */}
          <div className="px-6">
            <SectionTitle>Temps total passé</SectionTitle>
            {allMetrics.map((m, i) => {
              const totalH = Math.floor(m.totalMinutes / 60);
              const totalM = m.totalMinutes % 60;
              const weeks = Math.floor(m.totalMinutes / (60 * 24 * 7));
              const days = Math.floor((m.totalMinutes % (60 * 24 * 7)) / (60 * 24));
              return (
                <div key={i} className="flex items-baseline gap-3 mb-4">
                  <span className="font-galinoy italic text-[34px] leading-none flex-shrink-0" style={{ color: colors[i] }}>{totalH}h{String(totalM).padStart(2, '0')}</span>
                  <div className="flex flex-col">
                    <span className="font-outfit text-[var(--theme-text)] opacity-40 text-[11px]">{m.label}</span>
                    <span className="font-outfit text-[var(--theme-text)] opacity-25 text-[10px]">{weeks > 0 ? `${weeks} sem. ${days}j` : `${days}j`}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <Divider />

          {/* Durée moy */}
          <div className="px-6">
            <SectionTitle>Durée moyenne</SectionTitle>
            {allMetrics.map((m, i) => (
              <div key={i} className="flex items-center gap-8 mb-4">
                <span className="font-galinoy italic text-[36px] leading-none w-20 text-right flex-shrink-0" style={{ color: colors[i] }}>{formatAvgDuration(m.avgDuration)}</span>
                <div className="flex-1 flex flex-col gap-1.5">
                  <AnimatedBar pct={mounted ? (m.avgDuration / maxAvgDur) * 100 : 0} isAccent={i === 0} />
                  <span className="font-outfit text-[11px] text-[var(--theme-text)] opacity-40">{m.label}</span>
                </div>
              </div>
            ))}
          </div>

          <Divider />

          {/* Finance */}
          <div className="px-6">
            <SectionTitle>Finance</SectionTitle>
            {allMetrics.map((m, i) => (
              <div key={i} className="rounded-2xl p-4 mb-3"
                   style={{ backgroundColor: 'color-mix(in srgb, var(--theme-text) 5%, transparent)', border: i === 0 ? '1px solid color-mix(in srgb, var(--theme-accent) 20%, transparent)' : '1px solid transparent' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i] }} />
                  <span className="font-outfit text-[var(--theme-text)] text-[13px] font-bold">{m.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                  {[
                    { label: 'Coût abonnement', value: `${m.totalSubCost.toFixed(2).replace('.', ',')}€` },
                    { label: 'Valeur théorique', value: `${m.totalStandardValue.toFixed(0)}€` },
                    { label: 'Économies', value: `${m.savings > 0 ? '+' : ''}${m.savings.toFixed(0)}€`, accent: m.savings > 0 },
                    { label: 'Coût / séance', value: m.costPerFilm > 0 ? `${m.costPerFilm.toFixed(2).replace('.', ',')}€` : '—' },
                  ].map(({ label, value, accent }, j) => (
                    <div key={j} className="flex flex-col">
                      <span className="font-outfit text-[var(--theme-text)] opacity-40 text-[10px] uppercase tracking-wider">{label}</span>
                      <span className="font-galinoy italic text-[22px] leading-none mt-0.5" style={{ color: accent ? 'var(--theme-accent)' : 'var(--theme-text)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Divider />

          {/* Verdict */}
          <div className="px-6 mb-12">
            <SectionTitle>Verdict</SectionTitle>
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-accent) 20%, transparent)' }}>
              <p className="font-outfit text-[var(--theme-text)] text-[18px] leading-snug">
                <span className="font-galinoy italic" style={{ color: 'var(--theme-accent)' }}>{winner.label}</span> remporte la mise avec {winner.totalFilms} films et une note de {winner.avgNote.toFixed(1).replace('.', ',')}.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION DIVIDER
// ─────────────────────────────────────────────
function SectionDivider() {
  return (
    <div className="mx-6 h-px" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-border) 25%, transparent)' }} />
  );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
export function Dashboard({
  historyData,
  pricing,
  userName,
  userAvatar,
  setSelectedFilm,
  setActiveTab,
  scrollY = 0,
}) {
  const [dashView, setDashView] = useState('all');
  const [dashValue, setDashValue] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelections, setCompareSelections] = useState([]);

  const [topPosterIdx, setTopPosterIdx] = useState(0);

  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonthIndex = now.getMonth();

  const availableYears = [...new Set(historyData.map((f) => f.date?.split('/')[2]).filter(Boolean))].sort((a, b) => b - a);
  const availableMonthsRaw = [...new Set(historyData.map((f) => {
    const parts = f.date?.split('/');
    return parts?.length === 3 ? `${parts[2]}-${parts[1]}` : null;
  }).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  const activeMonth = dashValue || (dashView === 'month' ? availableMonthsRaw[0] : '');
  const activeYear = dashValue || (dashView === 'year' ? availableYears[0] : '');

  // ── Filtered data for the selected period ─────────
  const dashData = historyData.filter((film) => {
    if (!film.date) return false;
    if (dashView === 'year') return film.date.endsWith(activeYear);
    if (dashView === 'month') {
      const [y, m] = activeMonth.split('-');
      if (!y || !m) return false;
      return film.date.endsWith(`${m}/${y}`);
    }
    return true;
  });

  // ── Core metrics ──────────────────────────────────
  const totalFilms = dashData.length;
  const notes = dashData.map((f) => parseFloat(String(f.note).replace(',', '.'))).filter((n) => !isNaN(n) && n > 0);
  const avgNote = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;

  const durations = dashData.map((f) => parseDuration(f.duree));
  const totalMinutes = durations.reduce((a, b) => a + b, 0);
  const avgDuration = durations.length > 0 ? Math.round(totalMinutes / durations.length) : 0;

  let vfCount = 0, voCount = 0;
  dashData.forEach((f) => {
    const l = (f.langue || 'VF').toUpperCase().trim();
    if (l === 'VF' || l === 'FRA' || l === 'VFQ') vfCount++;
    else voCount++;
  });
  const totalLang = vfCount + voCount;
  const voPct = totalLang > 0 ? Math.round((voCount / totalLang) * 100) : 0;

  // ── Habits ───────────────────────────────────────
  const seatCounts = {}, roomCounts = {};
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const timeCounts = { 'Matin': 0, 'Après-midi': 0, 'Soirée': 0, 'Nuit': 0 };

  dashData.forEach((f) => {
    const siege = String(f.siege || '').trim().toUpperCase();
    const salle = String(f.salle || '').trim();
    if (siege && siege !== '?' && siege !== 'NON RENSEIGNÉ') seatCounts[siege] = (seatCounts[siege] || 0) + 1;
    if (salle && salle !== '?' && salle !== 'NON RENSEIGNÉE') roomCounts[salle] = (roomCounts[salle] || 0) + 1;

    if (f.date) {
      const [d, m, y] = f.date.split('/');
      const dateObj = new Date(y, m - 1, d);
      if (!isNaN(dateObj)) dayCounts[dateObj.getDay()]++;
    }

    if (f.heure) {
      const h = parseInt(f.heure.split(':')[0], 10);
      if (!isNaN(h)) {
        if (h < 12) timeCounts['Matin']++;
        else if (h < 18) timeCounts['Après-midi']++;
        else if (h < 22) timeCounts['Soirée']++;
        else timeCounts['Nuit']++;
      }
    }
  });

  const favoriteSeat = Object.entries(seatCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const topRoom = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const favDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const favDay = Math.max(...dayCounts) > 0 ? dayNames[favDayIndex] : '--';
  const favTime = Math.max(...Object.values(timeCounts)) > 0
    ? Object.keys(timeCounts).reduce((a, b) => (timeCounts[a] > timeCounts[b] ? a : b))
    : '--';

  // ── Finance ──────────────────────────────────────
  const getPrice = (year, type) => {
    let p = pricing?.default?.[type] || (type === 'sub' ? 21.90 : 13.00);
    if (pricing?.[year]?.[type] !== undefined) p = pricing[year][type];
    return parseFloat(p) || 0;
  };
  const getMonthsToCharge = (y) => (y === currentYear ? currentMonthIndex + 1 : 12);
  const totalStandardValue = dashData.reduce((acc, film) => acc + getPrice(film.date?.split('/')[2] || currentYear, 'ticket'), 0);

  let totalSubCost = 0;
  if (dashView === 'month') { const year = activeMonth.split('-')[0]; totalSubCost = getPrice(year, 'sub'); }
  else if (dashView === 'year') { totalSubCost = getMonthsToCharge(activeYear) * getPrice(activeYear, 'sub'); }
  else { availableYears.forEach((y) => { totalSubCost += getMonthsToCharge(y) * getPrice(y, 'sub'); }); }

  const savings = totalStandardValue - totalSubCost;
  const costPerFilm = totalFilms > 0 ? totalSubCost / totalFilms : 0;

  // ── Delta for duration ───────────────────────────
  const getPrevAvgDuration = () => {
    if (dashView === 'year') {
      const idx = availableYears.indexOf(activeYear);
      if (idx >= availableYears.length - 1) return null;
      const prev = availableYears[idx + 1];
      const pf = historyData.filter(f => f.date?.endsWith(prev));
      if (!pf.length) return null;
      return Math.round(pf.map(f => parseDuration(f.duree)).reduce((a, b) => a + b, 0) / pf.length);
    }
    if (dashView === 'month') {
      const idx = availableMonthsRaw.indexOf(activeMonth);
      if (idx >= availableMonthsRaw.length - 1) return null;
      const [py, pm] = availableMonthsRaw[idx + 1].split('-');
      const pf = historyData.filter(f => f.date?.endsWith(`${pm}/${py}`));
      if (!pf.length) return null;
      return Math.round(pf.map(f => parseDuration(f.duree)).reduce((a, b) => a + b, 0) / pf.length);
    }
    return null;
  };

  const prevAvgDuration = getPrevAvgDuration();
  const durationDeltaPct = prevAvgDuration ? Math.round(((avgDuration - prevAvgDuration) / prevAvgDuration) * 100) : 12;

  // ── Coups de cœur ────────────────────────────────
  const coupsDeCoeur = dashData
    .filter(f => {
      const ok = f.coupDeCoeur === true || f.coupDeCoeur === 'OUI' || f.coupDeCoeur === 1;
      const n = parseFloat(String(f.note || '0').replace(',', '.'));
      return ok || n >= 4.5;
    })
    .sort((a, b) => {
      const p = (d) => { if (!d) return 0; const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd).getTime(); };
      return p(b.date) - p(a.date);
    })
    .slice(0, 2);

  // ── Capucines ─────────────────────────────────────
  const capucinesFilms = dashData.filter(f => f.capucine === true || f.capucine === 1 || String(f.capucine) === '1');
  const capucinesCount = capucinesFilms.length;

  // Total possible Capucines films for the selected period
  const capucinesTotalForPeriod = getCapucinesTotalForPeriod(dashView, dashView === 'month' ? activeMonth : activeYear, availableYears);

  // Is the selected month outside the Capucines season?
  const isNonCapucinesMonth = dashView === 'month' && capucinesTotalForPeriod === 0;

  // Clamp to 100% max
  const capucinesPct = capucinesTotalForPeriod > 0
    ? Math.min(100, Math.round((capucinesCount / capucinesTotalForPeriod) * 100))
    : 0;

  // ── Monthly avg ──────────────────────────────────
  const monthlyAvg = Math.round(totalFilms / Math.max(1, dashView === 'year' ? getMonthsToCharge(activeYear) : dashView === 'month' ? 1 : Math.max(1, availableYears.length * 12))) || 9;
  const periodLabel = dashView === 'year' ? activeYear : dashView === 'month' ? (() => { const [y, m] = activeMonth.split('-'); return `${monthNames[parseInt(m, 10) - 1]} ${y}`; })() : currentYear;

  // ── Sorted by date (latest first) — for ALL of dashData ─────────
  const sortedByDate = dashData
    .filter(f => f.affiche || f.titre)
    .sort((a, b) => {
      const p = (d) => { if (!d) return 0; const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd).getTime(); };
      return p(b.date) - p(a.date);
    });

  const latestFour = sortedByDate.slice(0, 24);

  // ── Decorative poster pool — always pull from dashData (period-aware) ──
  // This fixes the bug where older periods showed no decorative posters:
  // we use sortedByDate (already filtered to the active period) instead of
  // a separate pool derived from all history.
  const decoPool = sortedByDate.filter(f => !!f.affiche);

  // Fallback: if the current period has no posters with affiche,
  // fall back to any film in dashData that has a titre (SmartPoster will handle fallback fetch)
  const decoPoolWithFallback = decoPool.length > 0
    ? decoPool
    : sortedByDate.slice(0, 12);

  const getPoster = (i) => {
    if (!decoPoolWithFallback.length) return null;
    return decoPoolWithFallback[i % decoPoolWithFallback.length] || null;
  };

  const scrolled = scrollY > 20;

  // ── Total time formatted ─────────────────────────
  const timeFormatted = formatTotalTime(totalMinutes);

  // ── Average note label ───────────────────────────
  const avgNoteLabel = avgNote < 3
    ? 'un critique chevronné'
    : avgNote <= 4
    ? 'un fin connaisseur'
    : 'très bon public';

  const formatLabel = (val, view) => {
    if (!val) return '';
    if (view === 'year') return val;
    const [yy, mm] = val.split('-');
    return `${monthNames[parseInt(mm, 10) - 1]} ${yy}`;
  };

  // ── Fav day last film ────────────────────────────
  const lastFilmOnFavDay = dashData
    .filter(f => {
      if (!f.date) return false;
      const [d, m, y] = f.date.split('/');
      const obj = new Date(y, m - 1, d);
      if (isNaN(obj)) return false;
      return obj.getDay() === favDayIndex;
    })
    .sort((a, b) => {
      const p = (d) => { const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd); };
      return p(b.date) - p(a.date);
    })[0] || null;

  const seatSharePct = favoriteSeat && totalFilms > 0 ? Math.round((favoriteSeat[1] / totalFilms) * 100) : 38;
  const roomSharePct = topRoom && totalFilms > 0 ? Math.round((topRoom[1] / totalFilms) * 100) : 14;

  // ── Compare helpers ──────────────────────────────
  const handleCompareClick = () => {
    if (dashView === 'all') return;
    setCompareMode('selector');
  };

  const buildAllMetrics = () => {
    const refValue = dashView === 'year' ? activeYear : activeMonth;
    return [
      computeMetrics(dashView, refValue, historyData, pricing),
      ...compareSelections.map(val => computeMetrics(dashView, val, historyData, pricing)),
    ];
  };

return (
    <>
      {/* 
          Correction : Suppression de 'overflow-hidden' sur le parent direct. 
          Si tu as peur des débordements horizontaux, utilise 'overflow-x-clip' 
          ou assure-toi que les éléments enfants ne dépassent pas.
      */}
      <div className="bg-[var(--theme-bg)] text-[var(--theme-text)] pb-12 relative w-full">

        {/* ── STICKY HEADER ── */}
        <header
          className="sticky top-0 z-[100] flex justify-between items-center px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 transition-all duration-300"
          style={{
            backgroundColor: `color-mix(in srgb, var(--theme-bg) ${scrolled ? 92 : 0}%, transparent)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            // On s'assure que le header reste bien au-dessus malgré tout
          }}
        >
          <div className="flex flex-col justify-center overflow-hidden">
            <div
              className="transition-all duration-300"
              style={{ 
                height: scrolled ? '0px' : '22px', 
                opacity: Math.max(0, 1 - scrollY / 60), 
                overflow: 'hidden' 
              }}
            >
              <span className="font-outfit text-[var(--theme-text)] text-base tracking-wide leading-none" style={{ opacity: 0.7 }}>
                {userName}, découvre
              </span>
            </div>
            <h1 className="font-galinoy italic text-[var(--theme-text)] text-4xl tracking-tight leading-none">
              ton cinéma
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter(true)}
              className={`relative w-11 h-11 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
                dashView !== 'all'
                  ? 'border-transparent text-[var(--theme-bg)]'
                  : 'border-[var(--theme-border)] text-[var(--theme-text)]'
              }`}
              style={{ 
                backgroundColor: dashView !== 'all' ? 'var(--theme-accent)' : 'color-mix(in srgb, var(--theme-text) 8%, transparent)' 
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              {dashView !== 'all' && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[var(--theme-bg)]" />
              )}
            </button>
          </div>
        </header>

        {/* ── FILTER DRAWER ── */}
        {showFilter && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilter(false)} />
            <div className="relative bg-[var(--theme-surface)] w-full rounded-t-[24px] p-5 pb-6 flex flex-col animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-[var(--theme-border)] max-h-[55vh]"
                 style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <div className="w-10 h-1 bg-[var(--theme-text)] opacity-10 rounded-full self-center mb-4" />
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-galinoy italic text-[var(--theme-text)] text-2xl">Timeline</h3>
                <button onClick={() => setShowFilter(false)} className="font-outfit text-sm font-bold" style={{ color: 'var(--theme-accent)' }}>OK</button>
              </div>
              <div className="overflow-y-auto scrollbar-hide flex flex-col px-4">
                <button onClick={() => { setDashView('all'); setDashValue(''); setShowFilter(false); }}
                        className={`py-3 text-left font-outfit text-[16px] transition-all border-l-2 pl-4 mb-2 ${dashView === 'all' ? 'font-bold' : 'opacity-40'}`}
                        style={{ borderColor: dashView === 'all' ? 'var(--theme-accent)' : 'color-mix(in srgb, var(--theme-border) 20%, transparent)', color: dashView === 'all' ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
                  Bilan Global
                </button>
                {availableYears.map(year => (
                  <div key={year} className="flex flex-col border-l-2" style={{ borderColor: 'color-mix(in srgb, var(--theme-border) 20%, transparent)' }}>
                    <button onClick={() => { setDashView('year'); setDashValue(year); setShowFilter(false); }}
                            className={`py-2 text-left pl-4 font-outfit text-[15px] transition-all ${dashView === 'year' && dashValue === year ? 'font-bold' : 'opacity-60 font-medium'}`}
                            style={{ color: dashView === 'year' && dashValue === year ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
                      {year}
                    </button>
                    <div className="flex flex-col mb-2">
                      {availableMonthsRaw.filter(m => m.startsWith(year)).map(m => (
                        <button key={m} onClick={() => { setDashView('month'); setDashValue(m); setShowFilter(false); }}
                                className={`py-1.5 text-left pl-8 font-outfit text-[14px] transition-all relative ${dashView === 'month' && dashValue === m ? 'font-bold' : 'opacity-30'}`}
                                style={{ color: dashView === 'month' && dashValue === m ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
                          <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full"
                               style={{ backgroundColor: dashView === 'month' && dashValue === m ? 'var(--theme-accent)' : 'var(--theme-border)' }} />
                          {formatLabel(m, 'month').split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────── */}
        {/* SECTION 1 — HERO                             */}
        {/* ───────────────────────────────────────────── */}
        <section className="relative px-6 pt-6 pb-10 overflow-hidden">

          {/* Decorative poster — top right, interactive.
              Uses getPoster(0) which pulls from the period-filtered decoPoolWithFallback,
              so it always shows a poster from the selected period, including older periods. */}
          {decoPoolWithFallback.length > 0 && (
            <div
              onClick={() => setTopPosterIdx(prev => prev + 1)}
              className="absolute right-4 top-0 w-[140px] h-[194px] rounded-[17px] overflow-hidden shadow-[0_0_12px_4px_rgba(0,0,0,0.25)] cursor-pointer z-20 transition-all duration-300 active:scale-95 hover:scale-105"
              style={{ transform: 'rotate(3deg)' }}>
              <SmartPoster
                afficheInitiale={decoPoolWithFallback[topPosterIdx % decoPoolWithFallback.length]?.affiche}
                titre={decoPoolWithFallback[topPosterIdx % decoPoolWithFallback.length]?.titre}
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>
          )}

          <div className="relative z-10 pr-[158px]">
            <p className="font-outfit text-[var(--theme-text)] text-[17px] font-bold mb-3 leading-none">Le compte est bon !</p>
            <p className="font-outfit text-[var(--theme-text)] text-[15px]" style={{ opacity: 0.8 }}>
              En <span className="font-semibold">{dashView === 'all' ? 'tout' : periodLabel}</span>, tu as vu
            </p>
          </div>

          {/* Giant number */}
          <div className="flex items-baseline gap-3 mt-2 mb-6">
            <span className="font-galinoy italic leading-none" style={{ fontSize: 'clamp(5rem,22vw,7rem)', color: 'var(--theme-accent)', lineHeight: 0.85 }}>
              {totalFilms}
            </span>
            <span className="font-outfit text-[var(--theme-text)] text-xl font-medium">films</span>
          </div>

          {/* Time in cinema */}
          <p className="font-outfit text-[var(--theme-text)] text-[14px] mt-14 leading-relaxed">
            Cela représente{' '}
            <span className="font-galinoy italic" style={{ color: 'var(--theme-accent)', fontSize: '1.4rem', lineHeight: 1 }}>
              {timeFormatted.value}
            </span>{' '}
            <span className="font-semibold">{timeFormatted.unit}</span> dans l'obscurité, quel dévouement !
          </p>

          {dashView !== 'month' && (
            <p className="font-outfit text-[14px] mt-5 leading-relaxed">
              C'est aussi{' '}
              <span className="font-galinoy italic" style={{ fontSize: '1.5rem', color: 'var(--theme-accent)', lineHeight: 1 }}>{monthlyAvg} </span>
              <span className="font-outfit text-[14px]" style={{ opacity: 0.8 }}>films par mois en moyenne.</span>
            </p>
          )}

          {avgNote > 0 && (
            <p className="font-outfit text-[14px] mt-5 leading-relaxed" style={{ maxWidth: '80%' }}>
              Avec une note moyenne de{' '}
              <span className="font-galinoy italic" style={{ color: 'var(--theme-accent)', fontSize: '1.1rem' }}>{avgNote.toFixed(1).replace('.', ',')}/5</span>
              , tu es <span className="font-semibold text-[var(--theme-text)]">{avgNoteLabel}</span> !
            </p>
          )}
        </section>

        <SectionDivider />

        {/* ───────────────────────────────────────────── */}
        {/* SECTION 2 — DERNIÈRES SÉANCES                */}
        {/* ───────────────────────────────────────────── */}
        {latestFour.length > 0 && (
          <section className="pt-6 pb-10">
            <p className="font-outfit text-[var(--theme-text)] font-bold text-[18px] px-6 mb-5">Tes dernières séances</p>
            <StackedPosters films={latestFour} onSelectFilm={setSelectedFilm} />
          </section>
        )}

        <SectionDivider />

        {/* ───────────────────────────────────────────── */}
        {/* SECTION 3 — COUPS DE CŒUR                    */}
        {/* ───────────────────────────────────────────── */}
        {coupsDeCoeur.length > 0 && (
          <section className="relative py-12 overflow-visible" style={{ backgroundColor: '#A31E20' }}>
            <div className="relative z-10">
              <p className="font-outfit font-bold text-[18px] mb-6 px-6" style={{ color: '#FFFDF2' }}>Tes derniers coups de coeur</p>

              <div className="flex gap-4 flex-1 justify-start px-6 w-full">
                {coupsDeCoeur.map((film, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFilm(film)}
                    className="flex-1 flex flex-col active:scale-95 transition-transform max-w-[160px]"
                  >
                    <div className="relative" style={{ paddingTop: 20, paddingLeft: 16, paddingRight: 16 }}>
                      {i === 0 && (
                        <>
                          <ChubbyHeart
                            className="absolute text-white drop-shadow-lg z-20 pointer-events-none"
                            style={{ top: -2, left: -2, width: 52, height: 52, transform: 'rotate(-18deg)' }}
                          />
                          <ChubbyHeart
                            className="absolute text-white drop-shadow-md z-20 pointer-events-none"
                            style={{ top: 18, left: -14, width: 34, height: 34, transform: 'rotate(-28deg)', opacity: 0.9 }}
                          />
                          <ChubbyHeart
                            className="absolute text-white drop-shadow-md z-20 pointer-events-none"
                            style={{ bottom: 30, left: -12, width: 40, height: 40, transform: 'rotate(12deg)', opacity: 0.85 }}
                          />
                        </>
                      )}
                      {i === 1 && (
                        <ChubbyHeart
                          className="absolute text-white drop-shadow-lg z-20 pointer-events-none"
                          style={{ top: -2, right: -2, width: 52, height: 52, transform: 'rotate(18deg)' }}
                        />
                      )}

                      <div className="w-full aspect-[2/3] rounded-[14px] overflow-hidden relative"
                           style={{ boxShadow: '-4px 0px 12px 4px rgba(0,0,0,0.25)', background: '#D9D9D9' }}>
                        <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover pointer-events-none" />

                        <div className="absolute inset-x-0 bottom-0 h-1/2 flex flex-col justify-end p-2 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                          <p className="font-galinoy text-white text-left text-[14px] leading-tight mb-2 pr-2 line-clamp-2">{film.titre}</p>
                          {film.note && (
                            <div className="border border-white rounded-[11px] px-2 py-0.5 self-start flex items-center gap-1 bg-white/10 backdrop-blur-sm">
                              <span className="font-outfit text-[8px] text-white uppercase">{film.genre || 'Film'}</span>
                              <span className="font-galinoy text-[10px] text-white">{String(film.note).replace('.', ',')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <SectionDivider />

        {/* ───────────────────────────────────────────── */}
        {/* SECTION 4 — PROFIL DE CINÉPHILE              */}
        {/* Decorative poster uses getPoster(4) which is */}
        {/* now period-aware via decoPoolWithFallback.    */}
        {/* ───────────────────────────────────────────── */}
        <section className="relative py-12 overflow-hidden">

          {getPoster(4) && (
            <div className="absolute left-4 top-6 w-[150px] h-[207px] rounded-[17px] overflow-hidden pointer-events-none"
                 style={{ transform: 'rotate(5deg)', opacity: 0.95, boxShadow: '0 0 12px 4px rgba(0,0,0,0.25)' }}>
              <SmartPoster afficheInitiale={getPoster(4)?.affiche} titre={getPoster(4)?.titre} className="w-full h-full object-cover" />
            </div>
          )}

          <p className="font-outfit text-[var(--theme-text)] font-bold text-[18px] px-6 mb-8 text-right">Ton profil de cinéphile</p>

          <div className="px-6 mb-10 text-right">
            <p className="font-outfit text-[var(--theme-text)] text-[18px] leading-snug inline-block text-right" style={{ maxWidth: '65%', opacity: 0.9 }}>
              En moyenne, les films que tu vas voir durent
            </p>
            <span className="font-galinoy block mt-1" style={{ fontSize: '3rem', color: 'var(--theme-accent)', lineHeight: 1 }}>
              {formatAvgDuration(avgDuration)}
            </span>
            <p className="font-outfit text-xs mt-3 leading-relaxed inline-block" style={{ opacity: 0.6, maxWidth: '60%' }}>
              C'est{' '}
              <span className="font-bold" style={{ color: 'var(--theme-text)', opacity: 1 }}>
                {Math.abs(durationDeltaPct)}% {durationDeltaPct >= 0 ? 'plus long' : 'plus court'}
              </span>{' '}
              que la période précédente. On ne t'arrête plus !
            </p>
          </div>

          <div className="px-6 flex items-start gap-4">
            <span className="font-galinoy flex-shrink-0" style={{ fontSize: '3rem', color: 'var(--theme-accent)', lineHeight: 1 }}>
              {voPct}%
            </span>
            <div className="flex flex-col text-right w-full">
              <p className="font-outfit text-[var(--theme-text)] font-semibold text-[18px] leading-tight mb-1">
                Hello! Ciao! Guten Tag!
              </p>
              <p className="font-outfit text-[13px] leading-snug mb-3 ml-auto" style={{ opacity: 0.7, maxWidth: '70%' }}>
                Sur la période, tu as vu{' '}
                <span className="font-bold" style={{ color: 'var(--theme-text)' }}>{voPct}%</span>{' '}
                de films en version originale étrangère. Un vrai cinéphile du monde !
              </p>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ───────────────────────────────────────────── */}
        {/* SECTION 5 — SALLE & SIÈGE FAVORIS            */}
        {/* Same fix: getPoster(5) now period-aware.      */}
        {/* ───────────────────────────────────────────── */}
        {(topRoom || favoriteSeat) && (
          <section className="relative py-12 overflow-hidden">
            {getPoster(5) && (
              <div className="absolute left-[-55px] top-8 w-[150px] h-[231px] rounded-[17px] overflow-hidden pointer-events-none"
                   style={{ opacity: 0.95, boxShadow: '0 0 12px 4px rgba(0,0,0,0.25)', transform: 'rotate(-6deg)' }}>
                <SmartPoster afficheInitiale={getPoster(5)?.affiche} titre={getPoster(5)?.titre} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="pl-20 pr-6 text-right">
              {topRoom && (
                <div className="mb-8">
                  <p className="font-outfit text-[var(--theme-text)] text-[18px]" style={{ opacity: 0.9 }}>C'est en</p>
                  <span className="font-galinoy block" style={{ fontSize: '2rem', color: 'var(--theme-accent)', lineHeight: 1.1 }}>
                    {topRoom[0]}
                  </span>
                  <p className="font-outfit text-[var(--theme-text)] text-[18px] mt-0.5" style={{ opacity: 0.8 }}>où tu as passé le plus de temps.</p>
                  <p className="font-outfit text-[12px] mt-2 leading-relaxed ml-auto" style={{ opacity: 0.55, maxWidth: '60%' }}>
                    Elle représente <span className="font-semibold" style={{ color: 'var(--theme-text)', opacity: 1 }}>{roomSharePct}%</span> de tes réservations. The place to be!
                  </p>
                </div>
              )}

              {favoriteSeat && (
                <div>
                  <p className="font-outfit text-[var(--theme-text)] text-[18px]" style={{ opacity: 0.9 }}>Tu adores t'asseoir en</p>
                  <span className="font-galinoy block" style={{ fontSize: '2rem', color: 'var(--theme-accent)', lineHeight: 1.1 }}>
                    {favoriteSeat[0]}
                  </span>
                  <p className="font-outfit text-[12px] mt-2 leading-relaxed ml-auto" style={{ opacity: 0.55, maxWidth: '70%' }}>
                    Cela correspond à <span className="font-semibold" style={{ color: 'var(--theme-text)', opacity: 1 }}>{seatSharePct}%</span> de tes séances à cette place. Ta deuxième maison en somme !
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ───────────────────────────────────────────── */}
        {/* SECTION 6 — JOUR & HEURE FAVORIS             */}
        {/* ───────────────────────────────────────────── */}
        {favDay !== '--' && (
          <>
            <SectionDivider />
            <section className="relative py-12 overflow-hidden">
              <div className="flex items-start gap-0 px-6">

                {/* LEFT */}
                <div className="flex-1 flex flex-col pr-6" style={{ minWidth: 0 }}>
                  <p className="font-outfit text-[var(--theme-text)] text-[12px] opacity-60 uppercase mb-5 tracking-wider">
                    Ton dernier film à cette période :
                  </p>

                  <p className="font-outfit text-[var(--theme-text)] font-bold text-[22px] leading-snug mb-8">
                    Il semblerait que tu trouves le plus souvent le chemin du cinéma
                  </p>

                  {/* Day + time pill */}
                  <div
                    className="inline-flex items-center gap-3 rounded-full px-4 py-2 self-start"
                    style={{ backgroundColor: 'var(--theme-accent)' }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                         style={{ backgroundColor: '#1a1a2e' }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M13 6.5C10.5 6.5 8.5 8.5 8.5 11C8.5 13.5 10.5 15.5 13 15.5C13.8 15.5 14.5 15.3 15.1 14.9C14.1 16.7 12.2 17.9 10 17.9C6.7 17.9 4 15.2 4 11.9C4 8.6 6.7 6 10 6C11.1 6 12.1 6.3 13 6.8V6.5Z" fill="white"/>
                        <path d="M15 3.5L15.5 5L17 5.5L15.5 6L15 7.5L14.5 6L13 5.5L14.5 5L15 3.5Z" fill="white"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-outfit font-bold text-[var(--theme-bg)] text-[18px] leading-none capitalize">Le {favDay}</span>
                      <span className="font-outfit text-[var(--theme-bg)] text-[12px] opacity-80 leading-none mt-0.5">en {favTime.toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: movie poster */}
                {lastFilmOnFavDay && (
                  <div
                    className="flex-shrink-0 rounded-[18px] overflow-hidden"
                    style={{
                      width: 120,
                      height: 172,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      background: '#D9D9D9',
                    }}
                  >
                    <SmartPoster
                      afficheInitiale={lastFilmOnFavDay.affiche}
                      titre={lastFilmOnFavDay.titre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        <SectionDivider />

        {/* ───────────────────────────────────────────── */}
        {/* SECTION 7 — L'EXPÉRIENCE CAPUCINES           */}
        {/*                                               */}
        {/* Total selection size is now period-aware:     */}
        {/* • Global → availableYears.length × 36         */}
        {/* • Year   → 36                                 */}
        {/* • Month in Jun–Nov → 6                        */}
        {/* • Month outside Jun–Nov → show 0/6 grayed msg */}
        {/* Capped at 100% max.                           */}
        {/* ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden mt-6">
          <div className="relative z-10 px-6 pt-10 pb-12" style={{ backgroundColor: '#7E0000' }}>

            <div className="absolute right-6 top-8 z-20 flex items-center justify-center">
              <div className="w-[85px] h-[85px] rounded-full bg-white flex items-center justify-center overflow-hidden shadow-[0_0_12px_2px_rgba(0,0,0,0.25)]">
                <img src="https://i.imgur.com/lg1bkrO.png" alt="Logo Capucines" className="w-full h-full object-contain p-2" />
              </div>
            </div>

            <p className="font-outfit font-bold text-white text-[18px] mb-6">L'expérience Capucines</p>

            {isNonCapucinesMonth ? (
              /* Selected month is outside Jun–Nov — no Capucines films that month */
              <div className="flex flex-col gap-1 mb-6 w-2/3">
                <span className="font-outfit text-white text-[18px]">
                  En <span className="font-semibold">{periodLabel}</span>
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="font-galinoy" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '2.5rem', lineHeight: 1 }}>0</span>
                  <span className="font-outfit text-white text-[18px] opacity-60">/ 6 films de la sélection</span>
                </div>
                <p className="font-outfit text-[12px] mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  Pas de sélection ce mois — la programmation Capucines se tient de juin à novembre.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1 mb-6 w-2/3">
                  <span className="font-outfit text-white text-[18px]">
                    En <span className="font-semibold">{dashView === 'all' ? 'tout' : periodLabel}</span> tu as vu
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-galinoy" style={{ color: 'var(--theme-accent)', fontSize: '2.5rem', lineHeight: 1 }}>{capucinesCount}</span>
                    <span className="font-outfit text-white text-[18px]">
                      film{capucinesTotalForPeriod > 1 ? 's' : ''} en compétition
                    </span>
                  </div>
                </div>

                {capucinesTotalForPeriod > 0 && (
                  <p className="font-outfit text-[12px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    C'est <span className="font-bold text-white">{capucinesPct}%</span> de la sélection{' '}
                    {dashView === 'year' ? 'annuelle' : dashView === 'all' ? 'totale' : 'du mois'}.{' '}
                    {capucinesPct === 0 ? 'Encore un effort !' : capucinesPct < 25 ? 'Un bel appétit !' : capucinesPct < 50 ? 'Tu t\'investis !' : capucinesPct < 100 ? 'Un vrai habitué !' : 'Collection complète !'}
                  </p>
                )}

                {capucinesFilms.length > 0 && (
                  <div className="mt-6" style={{ marginLeft: -24, marginRight: -24 }}>
                    <StackedPosters
                      films={capucinesFilms.slice(0, 200)}
                      onSelectFilm={setSelectedFilm}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ───────────────────────────────────────────── */}
        {/* SECTION 8 — ANALYSE FINANCIÈRE               */}
        {/* ───────────────────────────────────────────── */}
        <section className="relative py-12 px-6">
          <p className="font-outfit font-bold text-[18px] mb-6 text-[var(--theme-text)]">L'analyse financière</p>

          <div className="flex flex-col gap-4 mb-6">
            <p className="font-outfit text-[var(--theme-text)] text-[18px] leading-snug" style={{ opacity: 0.9 }}>
              Tu as fait le bon choix en prenant un Cinépass. Avec ton abonnement, une séance te revient à :
            </p>
            <span className="font-galinoy" style={{ fontSize: '3rem', color: 'var(--theme-accent)', lineHeight: 0.85 }}>
              {costPerFilm.toFixed(2).replace('.', ',')}€
            </span>
          </div>

          {savings > 0 && (
            <p className="font-outfit text-[13px] mt-4 leading-relaxed" style={{ opacity: 0.7 }}>
              Sans abonnement, tu aurais dépensé{' '}
              <span className="font-semibold text-[var(--theme-text)]" style={{ opacity: 1 }}>{totalStandardValue.toFixed(0)}€</span> sur la période (au lieu de{' '}
              <span className="font-semibold text-[var(--theme-text)]" style={{ opacity: 1 }}>{totalSubCost.toFixed(0)}€</span>). Cela représente une économie de{' '}
              <span className="font-semibold text-[var(--theme-text)]" style={{ opacity: 1 }}>{Math.round((savings / Math.max(totalStandardValue, 1)) * 100)}%</span> ! Une affaire !
            </p>
          )}
        </section>

        {/* ───────────────────────────────────────────── */}
        {/* SECTION 9 — COMPARER                         */}
        {/* ───────────────────────────────────────────── */}
        <section className="py-16 px-6 flex flex-col items-start">
          <p className="font-outfit text-[var(--theme-text)] text-[18px] leading-snug mb-8">
            Quelle aventure que cette période{' '}
            <span className="font-semibold">{dashView === 'all' ? 'Global' : periodLabel}</span> !<br />
            Tu veux la comparer avec une autre ?
          </p>

          <button
            onClick={handleCompareClick}
            disabled={dashView === 'all'}
            className="border rounded-[14px] px-10 py-3 font-outfit text-[18px] active:scale-95 transition-all bg-transparent"
            style={{
              borderColor: dashView === 'all' ? 'color-mix(in srgb, var(--theme-text) 20%, transparent)' : 'var(--theme-text)',
              color: 'var(--theme-text)',
              opacity: dashView === 'all' ? 0.35 : 1,
              cursor: dashView === 'all' ? 'not-allowed' : 'pointer',
            }}
          >
            Comparer
          </button>

          {dashView === 'all' && (
            <p className="font-outfit text-[11px] opacity-30 mt-3 max-w-[24ch] leading-relaxed">
              Sélectionne une année ou un mois pour activer la comparaison.
            </p>
          )}
        </section>
      </div>

      {/* ── OVERLAYS ── */}
      {compareMode === 'selector' && (
        <CompareSelector
          dashView={dashView}
          dashValue={dashView === 'year' ? activeYear : activeMonth}
          availableYears={availableYears}
          availableMonthsRaw={availableMonthsRaw}
          onConfirm={(selections) => { setCompareSelections(selections); setCompareMode('view'); }}
          onClose={() => setCompareMode(false)}
        />
      )}

      {compareMode === 'view' && compareSelections.length > 0 && (
        <CompareView
          allMetrics={buildAllMetrics()}
          onClose={() => { setCompareMode(false); setCompareSelections([]); }}
        />
      )}
    </>
  );
}