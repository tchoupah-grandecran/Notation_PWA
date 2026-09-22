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

  const availableYears = [
    ...new Set(
      historyData
        .map((f) => f.date?.split('/')[2])
        .filter(Boolean)
    ),
  ].sort((a, b) => b - a);

  const getPrice = (year, type) => {
    let p =
      pricing?.default?.[type] ||
      (type === 'sub' ? 21.90 : 13.00);

    if (pricing?.[year]?.[type] !== undefined) {
      p = pricing[year][type];
    }

    return parseFloat(p) || 0;
  };

  const getMonthsToCharge = (year) =>
    year === currentYear ? currentMonthIndex + 1 : 12;

  const dashData = historyData
    .filter((film) => {
      if (!film.date) return false;

      if (periodView === 'year') {
        return film.date.endsWith(periodValue);
      }

      if (periodView === 'month') {
        const [y, m] = periodValue.split('-');
        if (!y || !m) return false;
        return film.date.endsWith(`${m}/${y}`);
      }

      return true;
    })
    .sort((a, b) => {
      const parseDate = (value) => {
        if (!value) return 0;
        const [d, m, y] = value.split('/').map(Number);
        return new Date(y, m - 1, d).getTime();
      };
      return parseDate(a.date) - parseDate(b.date);
    });

  const totalFilms = dashData.length;

  const notes = dashData
    .map((f) => parseFloat(String(f.note || '').replace(',', '.')))
    .filter((n) => !isNaN(n) && n > 0);

  const avgNote =
    notes.length > 0
      ? notes.reduce((a, b) => a + b, 0) / notes.length
      : 0;

  const durations = dashData.map((f) => parseDuration(f.duree));
  const totalMinutes = durations.reduce((a, b) => a + b, 0);
  const avgDuration =
    durations.length > 0
      ? Math.round(totalMinutes / durations.length)
      : 0;

  let vfCount = 0;
  let voCount = 0;

  dashData.forEach((film) => {
    const language = String(film.langue || 'VF').toUpperCase().trim();
    if (language === 'VF' || language === 'FRA' || language === 'VFQ') {
      vfCount++;
    } else {
      voCount++;
    }
  });

  const totalLang = vfCount + voCount;
  const voPct = totalLang > 0 ? Math.round((voCount / totalLang) * 100) : 0;
  const vfPct = 100 - voPct;

  const coupsDeCoeurCount = dashData.filter((film) => {
    const explicit =
      film.coupDeCoeur === true ||
      film.coupDeCoeur === 'OUI' ||
      film.coupDeCoeur === 1;
    const note = parseFloat(String(film.note || '0').replace(',', '.'));
    return explicit || note >= 4.5;
  }).length;

  const totalStandardValue = dashData.reduce(
    (acc, film) =>
      acc + getPrice(film.date?.split('/')[2] || currentYear, 'ticket'),
    0
  );

  let totalSubCost = 0;

  if (periodView === 'month') {
    const year = periodValue.split('-')[0];
    totalSubCost = getPrice(year, 'sub');
  } else if (periodView === 'year') {
    totalSubCost = getMonthsToCharge(periodValue) * getPrice(periodValue, 'sub');
  } else {
    availableYears.forEach((year) => {
      totalSubCost += getMonthsToCharge(year) * getPrice(year, 'sub');
    });
  }

  const savings = totalStandardValue - totalSubCost;
  const costPerFilm = totalFilms > 0 ? totalSubCost / totalFilms : 0;

  /* ── distribution des notes ── */
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: notes.filter(
      (note) =>
        Math.round(note * 2) / 2 >= rating - 0.25 &&
        Math.round(note * 2) / 2 < rating + 0.25
    ).length,
  }));

  /* ── films pour les affiches ── */
  const films = [...dashData]
    .filter((film) => film.affiche || film.titre)
    .reverse();

  /* ── évolution (courbe) ── */
  let evolution = [];

  if (periodView === 'year') {
    evolution = Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, '0');
      const monthFilms = dashData.filter((film) =>
        film.date?.endsWith(`${month}/${periodValue}`)
      );
      const monthNotes = monthFilms
        .map((film) => parseFloat(String(film.note || '').replace(',', '.')))
        .filter((n) => !isNaN(n) && n > 0);

      return {
        label: monthNames[index].slice(0, 3),
        value: monthFilms.length,
        note:
          monthNotes.length > 0
            ? monthNotes.reduce((a, b) => a + b, 0) / monthNotes.length
            : 0,
      };
    });
  } else {
    evolution = dashData.map((film) => ({
      label: film.date?.slice(0, 5) || '',
      value: 1,
      note: parseFloat(String(film.note || '').replace(',', '.')) || 0,
    }));
  }

  // ─────────────────────────────────────
  // ÉVOLUTION TEMPORELLE (barres / filmsByMonth)
  // ─────────────────────────────────────
  const filmsByMonth = [];

  if (periodView === 'year') {
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${periodValue}-${String(month).padStart(2, '0')}`;
      const monthFilms = historyData.filter((film) => {
        if (!film.date) return false;
        const [d, m, y] = film.date.split('/');
        return y === periodValue && parseInt(m, 10) === month;
      });
      const monthNotes = monthFilms
        .map((f) => parseFloat(String(f.note || '').replace(',', '.')))
        .filter((n) => !isNaN(n) && n > 0);

      filmsByMonth.push({
        key: monthKey,
        label: monthNames[month - 1].slice(0, 3),
        count: monthFilms.length,
        avgNote:
          monthNotes.length > 0
            ? monthNotes.reduce((a, b) => a + b, 0) / monthNotes.length
            : 0,
      });
    }
  } else if (periodView === 'month') {
    const monthFilms = dashData.slice().sort((a, b) => {
      const [da] = a.date.split('/');
      const [db] = b.date.split('/');
      return Number(da) - Number(db);
    });

    monthFilms.forEach((film) => {
      const [day] = film.date.split('/');
      filmsByMonth.push({
        key: `${periodValue}-${day}`,
        label: `${Number(day)}`,
        count: 1,
        avgNote: parseFloat(String(film.note || '').replace(',', '.')) || 0,
      });
    });
  } else {
    availableYears.slice().reverse().forEach((year) => {
      const yearFilms = historyData.filter(
        (film) => film.date && film.date.endsWith(year)
      );
      const yearNotes = yearFilms
        .map((f) => parseFloat(String(f.note || '').replace(',', '.')))
        .filter((n) => !isNaN(n) && n > 0);

      filmsByMonth.push({
        key: year,
        label: year,
        count: yearFilms.length,
        avgNote:
          yearNotes.length > 0
            ? yearNotes.reduce((a, b) => a + b, 0) / yearNotes.length
            : 0,
      });
    });
  }

  // ─────────────────────────────────────
  // TIMELINE DES FILMS
  // ─────────────────────────────────────
  const timeline = dashData.slice().sort((a, b) => {
    const parseDate = (value) => {
      const [d, m, y] = String(value).split('/');
      return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
    };
    return parseDate(a.date) - parseDate(b.date);
  }).map((film) => ({
    ...film,
    parsedNote: parseFloat(String(film.note || '').replace(',', '.')) || 0,
    parsedDuration: parseDuration(film.duree),
  }));

  return {
    totalFilms,
    avgNote,
    totalMinutes,
    avgDuration,

    voPct,
    vfPct,
    voCount,
    vfCount,

    coupsDeCoeurCount,

    totalStandardValue,
    totalSubCost,
    savings,
    costPerFilm,

    ratingDistribution,
    evolution,
    films,
    filmsByMonth,
    timeline,

    label: formatPeriodLabel(periodView, periodValue),
  };
};

// ─────────────────────────────────────────────
// CAPUCINES HELPERS
// ─────────────────────────────────────────────
const CAPUCINES_MONTHS = [6, 7, 8, 9, 10, 11];
const CAPUCINES_PER_MONTH = 6;
const CAPUCINES_PER_YEAR = 36;

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
// FOLDING DECK POSTERS
// ─────────────────────────────────────────────
function StackedPosters({ films, onSelectFilm }) {
  const CARD_W = 86;
  const CARD_H = 120;
  const DEPLOYED_GAP = 72;
  const STACKED_GAP = 6;

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

  const totalContentWidth = CARD_W + (films.length - 1) * DEPLOYED_GAP;
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
        <div style={{ position: 'relative', width: trackWidth, height: CARD_H, flexShrink: 0 }}>
          {films.map((film, i) => {
            const baseLeft = i * DEPLOYED_GAP;
            const stackedLeft = i * STACKED_GAP;
            const threshold = baseLeft - stackedLeft;
            const offset = Math.max(0, scrollX - threshold);

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: baseLeft,
                  transform: `translate3d(${offset}px, 0, 0)`,
                  top: 0,
                  zIndex: i + 1,
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
// COMPARE VIEW — CINEMA STORY
// ─────────────────────────────────────────────

function CompareView({ allMetrics, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState('films');
  const [posterPeriod, setPosterPeriod] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 80);

    return () => clearTimeout(timer);
  }, []);

  const palette = [
    'var(--compare-coral)',
    'var(--compare-blue)',
    'var(--compare-yellow)',
  ];

  const reference = allMetrics[0];
  const secondary = allMetrics[1];

  const maxFilms = Math.max(
    ...allMetrics.map((m) => m.totalFilms),
    1
  );

  const maxDuration = Math.max(
    ...allMetrics.map((m) => m.avgDuration),
    1
  );

  const totalComparedFilms = allMetrics.reduce(
    (sum, m) => sum + m.totalFilms,
    0
  );

  const first = reference;
  const second = secondary;

  const filmsDelta =
    second && first
      ? second.totalFilms - first.totalFilms
      : 0;

  const noteDelta =
    second && first
      ? second.avgNote - first.avgNote
      : 0;

  const durationDelta =
    second && first
      ? second.avgDuration - first.avgDuration
      : 0;

  const formatDelta = (value, suffix = '') => {
    if (value === 0) return 'même niveau';

    return `${value > 0 ? '+' : ''}${value}${suffix}`;
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h${String(mins).padStart(2, '0')}`;
  };

  const Donut = ({
    vo,
    vf,
    colorA,
    colorB,
    size = 220,
  }) => {
    const radius = 78;
    const circumference = 2 * Math.PI * radius;

    const voLength =
      circumference * (vo / 100);

    const vfLength =
      circumference * (vf / 100);

    return (
      <div
        className="relative"
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          className="-rotate-90"
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,.08)"
            strokeWidth="28"
          />

          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={colorA}
            strokeWidth="28"
            strokeDasharray={`${voLength} ${circumference}`}
            strokeLinecap="butt"
          />

          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={colorB}
            strokeWidth="28"
            strokeDasharray={`${vfLength} ${circumference}`}
            strokeDashoffset={-voLength}
            strokeLinecap="butt"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="compare-story-number"
            style={{
              fontSize: 42,
              color: 'var(--compare-ink)',
            }}
          >
            {vo}%
          </span>

          <span
            className="font-outfit text-[11px] uppercase tracking-[.16em]"
            style={{
              color: 'var(--compare-ink)',
              opacity: .45,
            }}
          >
            VO
          </span>
        </div>
      </div>
    );
  };

  const EvolutionChart = ({ metric }) => {
    const values = metric.evolution || [];

    if (!values.length) return null;

    const width = 700;
    const height = 220;
    const padding = 24;

    const max =
      Math.max(
        ...values.map((v) =>
          activeMetric === 'films'
            ? v.value
            : v.note
        ),
        1
      );

    const points = values.map((item, index) => {
      const x =
        padding +
        (index /
          Math.max(values.length - 1, 1)) *
          (width - padding * 2);

      const value =
        activeMetric === 'films'
          ? item.value
          : item.note;

      const y =
        height -
        padding -
        (value / max) *
          (height - padding * 2);

      return {
        x,
        y,
        value,
        label: item.label,
      };
    });

    const path = points
      .map((point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      )
      .join(' ');

    return (
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          {[0, .25, .5, .75, 1].map((line) => (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={
                height -
                padding -
                line *
                  (height - padding * 2)
              }
              y2={
                height -
                padding -
                line *
                  (height - padding * 2)
              }
              stroke="currentColor"
              opacity=".10"
            />
          ))}

          <path
            d={path}
            fill="none"
            stroke="var(--compare-coral)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1200,
              strokeDashoffset: mounted ? 0 : 1200,
              transition:
                'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)',
            }}
          />

          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="var(--compare-paper)"
                stroke="var(--compare-coral)"
                strokeWidth="3"
              />

              {index % Math.max(
                1,
                Math.floor(values.length / 6)
              ) === 0 && (
                <text
                  x={point.x}
                  y={height - 2}
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                  opacity=".45"
                  fontFamily="Outfit"
                >
                  {point.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const RatingBars = ({ metric, color }) => {
    const distribution =
      metric.ratingDistribution || [];

    const max =
      Math.max(
        ...distribution.map((x) => x.count),
        1
      );

    return (
      <div className="flex items-end gap-2 h-[190px]">
        {distribution.map((item) => (
          <div
            key={item.rating}
            className="flex-1 h-full flex flex-col justify-end items-center gap-2"
          >
            <span
              className="font-outfit text-[11px]"
              style={{ opacity: .55 }}
            >
              {item.count}
            </span>

            <div
              className="w-full rounded-t-[10px]"
              style={{
                height: `${Math.max(
                  8,
                  (item.count / max) * 125
                )}px`,
                backgroundColor: color,
                opacity: .85,
                transformOrigin: 'bottom',
                transform: mounted
                  ? 'scaleY(1)'
                  : 'scaleY(0)',
                transition:
                  `transform .65s cubic-bezier(.2,.8,.2,1) ${item.rating * 70}ms`,
              }}
            />

            <span
              className="font-galinoy italic text-[20px]"
              style={{ color }}
            >
              {item.rating}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const PosterStrip = ({ metric, color, reversed = false }) => {
    const films = metric.films || [];

    if (!films.length) {
      return (
        <div
          className="font-outfit text-sm"
          style={{ opacity: .45 }}
        >
          Aucune affiche disponible.
        </div>
      );
    }

    const visible = films.slice(
      posterPeriod * 8,
      posterPeriod * 8 + 8
    );

    return (
      <div className="relative">
        <div className="flex gap-3 overflow-hidden">
          {visible.map((film, index) => (
            <button
              key={`${film.titre}-${index}`}
              type="button"
              onClick={() =>
                typeof setSelectedFilm !== 'undefined' &&
                setSelectedFilm(film)
              }
              className="compare-story-poster flex-shrink-0 w-[78px] sm:w-[92px] aspect-[2/3] rounded-[10px] overflow-hidden"
              style={{
                transform:
                  index % 2 === 0
                    ? 'rotate(-2deg)'
                    : 'rotate(2deg)',
                background: color,
              }}
            >
              <SmartPoster
                afficheInitiale={film.affiche}
                titre={film.titre}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {films.length > 8 && (
          <div className="flex justify-between items-center mt-5">
            <span
              className="font-outfit text-[11px]"
              style={{ opacity: .45 }}
            >
              {Math.min(
                posterPeriod * 8 + 1,
                films.length
              )}
              –{Math.min(
                posterPeriod * 8 + 8,
                films.length
              )}{' '}
              / {films.length}
            </span>

            <button
              type="button"
              onClick={() =>
                setPosterPeriod((value) =>
                  (value + 1) *
                    8 >= films.length
                    ? 0
                    : value + 1
                )
              }
              className="font-outfit text-[11px] font-bold uppercase tracking-wider"
              style={{ color }}
            >
              Voir la suite →
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col"
      style={{
        backgroundColor: 'var(--compare-paper)',
        color: 'var(--compare-ink)',
      }}
    >
      {/* HEADER */}

      <header
        className="flex-shrink-0 px-5 sm:px-8 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 flex items-center justify-between border-b"
        style={{
          borderColor: 'rgba(0,0,0,.10)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0,0,0,.06)',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M11 4L6 9l5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div>
            <p
              className="font-outfit text-[9px] uppercase tracking-[.18em]"
              style={{ opacity: .4 }}
            >
              Grand Écran · Comparaison
            </p>

            <h2
              className="font-galinoy italic text-[24px] leading-none"
            >
              Deux périodes.
            </h2>
          </div>
        </div>

        <div
          className="font-outfit text-[10px] uppercase tracking-wider text-right"
          style={{ opacity: .45 }}
        >
          {allMetrics.length} périodes
        </div>
      </header>

      {/* STORY */}

      <main
        className="flex-1 overflow-y-auto scrollbar-hide compare-story"
        style={{
          paddingBottom:
            'calc(env(safe-area-inset-bottom) + 3rem)',
        }}
      >

        {/* ─────────────────────────────
            01 — INTRO
        ───────────────────────────── */}

        <section
          className="compare-story-section px-6 sm:px-10 pt-12 pb-16"
          style={{
            background:
              'linear-gradient(135deg, #F5F0E8 0%, #F8D9D1 100%)',
          }}
        >
          <div className="compare-story-noise" />

          <div className="relative z-10 max-w-[900px] mx-auto">

            <p
              className="font-outfit text-[11px] uppercase tracking-[.22em] mb-5"
              style={{ opacity: .45 }}
            >
              Une histoire de cinéma
            </p>

            <h1
              className="font-galinoy italic leading-[.9]"
              style={{
                fontSize:
                  'clamp(4.5rem, 17vw, 10rem)',
                letterSpacing: '-.07em',
              }}
            >
              Deux périodes.
              <br />
              <span style={{ color: palette[0] }}>
                Une même passion.
              </span>
            </h1>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {allMetrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className="relative p-5 sm:p-7 min-h-[190px] flex flex-col justify-between"
                  style={{
                    backgroundColor:
                      palette[index] || palette[2],
                    color:
                      index === 2
                        ? 'var(--compare-ink)'
                        : '#fff',
                    transform:
                      index % 2 === 0
                        ? 'rotate(-1deg)'
                        : 'rotate(1deg)',
                  }}
                >
                  <span
                    className="font-outfit text-[10px] uppercase tracking-[.18em]"
                    style={{ opacity: .7 }}
                  >
                    {index === 0
                      ? 'Référence'
                      : 'Comparaison'}
                  </span>

                  <div>
                    <div
                      className="compare-story-number leading-none"
                      style={{ fontSize: 'clamp(4rem,12vw,7rem)' }}
                    >
                      {metric.totalFilms}
                    </div>

                    <div className="font-outfit text-[13px] font-semibold">
                      films · {metric.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p
              className="font-outfit text-[18px] sm:text-[21px] leading-[1.35] mt-12 max-w-[600px]"
            >
              Même passion, mais pas forcément le même rythme.
              <span style={{ color: palette[0], fontWeight: 800 }}>
                {' '}Regardons ce qui change.
              </span>
            </p>
          </div>
        </section>


        {/* ─────────────────────────────
            02 — RYTHME
        ───────────────────────────── */}

        <section
          className="compare-story-section px-6 sm:px-10 py-16"
          style={{
            backgroundColor: '#1D2235',
            color: '#FFF8EF',
          }}
        >
          <div className="max-w-[900px] mx-auto">

            <div className="flex items-end justify-between gap-6 mb-10">
              <div>
                <p
                  className="font-outfit text-[10px] uppercase tracking-[.2em] mb-3"
                  style={{
                    color: palette[2],
                  }}
                >
                  02 · Le rythme
                </p>

                <h2
                  className="font-galinoy italic text-[clamp(3rem,10vw,6rem)] leading-[.9]"
                >
                  Ça défile.
                </h2>
              </div>

              <div
                className="hidden sm:block font-outfit text-right text-[12px]"
                style={{ opacity: .55 }}
              >
                Films vus
                <br />
                au fil du temps
              </div>
            </div>

            <div
              className="p-5 sm:p-8 rounded-[24px]"
              style={{
                backgroundColor: 'rgba(255,255,255,.06)',
              }}
            >
              <div className="flex gap-2 mb-7">
                {[
                  ['films', 'Films'],
                  ['note', 'Note'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setActiveMetric(value)
                    }
                    className="rounded-full px-4 py-2 font-outfit text-[11px] font-semibold"
                    style={{
                      backgroundColor:
                        activeMetric === value
                          ? palette[2]
                          : 'rgba(255,255,255,.08)',
                      color:
                        activeMetric === value
                          ? '#151515'
                          : '#fff',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <EvolutionChart metric={reference} />
            </div>

            {secondary && (
              <div className="mt-12 grid grid-cols-2 gap-8">
                <div>
                  <span
                    className="compare-story-number text-[64px]"
                    style={{ color: palette[2] }}
                  >
                    {formatDelta(filmsDelta)}
                  </span>

                  <p
                    className="font-outfit text-[12px] mt-1"
                    style={{ opacity: .6 }}
                  >
                    films entre les deux périodes
                  </p>
                </div>

                <div>
                  <span
                    className="compare-story-number text-[64px]"
                    style={{ color: palette[0] }}
                  >
                    {formatDelta(
                      Math.round(
                        noteDelta * 10
                      ) / 10,
                      ' pt'
                    )}
                  </span>

                  <p
                    className="font-outfit text-[12px] mt-1"
                    style={{ opacity: .6 }}
                  >
                    évolution de la note moyenne
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>


        {/* ─────────────────────────────
            03 — GOÛTS
        ───────────────────────────── */}

        <section
          className="compare-story-section px-6 sm:px-10 py-16"
          style={{
            backgroundColor: palette[2],
          }}
        >
          <div className="max-w-[900px] mx-auto">

            <p
              className="font-outfit text-[10px] uppercase tracking-[.2em] mb-4"
              style={{ opacity: .5 }}
            >
              03 · Les goûts
            </p>

            <h2
              className="font-galinoy italic leading-[.9]"
              style={{
                fontSize:
                  'clamp(3.5rem,11vw,7rem)',
              }}
            >
              Dans quelle
              <br />
              langue ?
            </h2>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-12 items-center">

              <div className="flex justify-center">
                <Donut
                  vo={reference.voPct}
                  vf={reference.vfPct}
                  colorA={palette[1]}
                  colorB="#FFF8EF"
                  size={230}
                />
              </div>

              <div>
                <p className="font-outfit text-[18px] leading-snug">
                  La VO représente{' '}
                  <strong>
                    {reference.voPct}%
                  </strong>{' '}
                  de tes séances sur{' '}
                  <strong>{reference.label}</strong>.
                </p>

                <div className="mt-8 flex gap-8">
                  <div>
                    <div
                      className="compare-story-number text-[48px]"
                      style={{
                        color: palette[1],
                      }}
                    >
                      {reference.voCount}
                    </div>
                    <span
                      className="font-outfit text-[11px] uppercase tracking-wider"
                      style={{ opacity: .55 }}
                    >
                      VO
                    </span>
                  </div>

                  <div>
                    <div
                      className="compare-story-number text-[48px]"
                    >
                      {reference.vfCount}
                    </div>
                    <span
                      className="font-outfit text-[11px] uppercase tracking-wider"
                      style={{ opacity: .55 }}
                    >
                      VF
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {secondary && (
              <div
                className="mt-16 pt-8 border-t"
                style={{
                  borderColor: 'rgba(0,0,0,.15)',
                }}
              >
                <p
                  className="font-outfit text-[12px] uppercase tracking-wider mb-6"
                  style={{ opacity: .5 }}
                >
                  Et dans l'autre période ?
                </p>

                <div className="flex items-center gap-6">
                  <Donut
                    vo={secondary.voPct}
                    vf={secondary.vfPct}
                    colorA={palette[0]}
                    colorB="rgba(255,255,255,.75)"
                    size={150}
                  />

                  <div>
                    <span
                      className="compare-story-number text-[54px]"
                      style={{ color: palette[0] }}
                    >
                      {secondary.voPct}%
                    </span>

                    <p className="font-outfit text-[12px]">
                      de VO · {secondary.label}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>


        {/* ─────────────────────────────
            04 — NOTES
        ───────────────────────────── */}

        <section
          className="compare-story-section px-6 sm:px-10 py-16"
          style={{
            backgroundColor: '#FFF8EF',
          }}
        >
          <div className="max-w-[900px] mx-auto">

            <div className="grid sm:grid-cols-[.8fr_1.2fr] gap-10 items-end">

              <div>
                <p
                  className="font-outfit text-[10px] uppercase tracking-[.2em] mb-4"
                  style={{
                    color: palette[0],
                  }}
                >
                  04 · Le verdict des notes
                </p>

                <h2
                  className="font-galinoy italic leading-[.88]"
                  style={{
                    fontSize:
                      'clamp(3.5rem,10vw,6rem)',
                  }}
                >
                  Tu as
                  <br />
                  aimé ?
                </h2>

                <div className="mt-8">
                  <span
                    className="compare-story-number"
                    style={{
                      fontSize: '6rem',
                      color: palette[0],
                    }}
                  >
                    {reference.avgNote
                      ? reference.avgNote
                          .toFixed(1)
                          .replace('.', ',')
                      : '—'}
                  </span>

                  <span className="font-outfit text-[18px] ml-2">
                    / 5
                  </span>
                </div>
              </div>

              <div>
                <RatingBars
                  metric={reference}
                  color={palette[0]}
                />

                <p
                  className="font-outfit text-[11px] mt-5"
                  style={{ opacity: .45 }}
                >
                  Distribution des notes · {reference.label}
                </p>
              </div>

            </div>

            {secondary && (
              <div
                className="mt-14 pt-8 border-t grid grid-cols-2 gap-8"
                style={{
                  borderColor: 'rgba(0,0,0,.1)',
                }}
              >
                <div>
                  <span
                    className="compare-story-number text-[42px]"
                    style={{ color: palette[1] }}
                  >
                    {secondary.avgNote
                      ? secondary.avgNote
                          .toFixed(1)
                          .replace('.', ',')
                      : '—'}
                  </span>

                  <p
                    className="font-outfit text-[11px]"
                    style={{ opacity: .45 }}
                  >
                    {secondary.label}
                  </p>
                </div>

                <p className="font-outfit text-[15px] leading-snug self-end">
                  La différence de moyenne est de{' '}
                  <strong>
                    {Math.abs(
                      Math.round(
                        noteDelta * 10
                      ) / 10
                    ).toFixed(1).replace('.', ',')}{' '}
                    point
                  </strong>.
                </p>
              </div>
            )}

          </div>
        </section>


        {/* ─────────────────────────────
            05 — TEMPS
        ───────────────────────────── */}

        <section
          className="compare-story-section px-6 sm:px-10 py-20"
          style={{
            backgroundColor: palette[1],
            color: '#fff',
          }}
        >
          <div className="max-w-[900px] mx-auto">

            <p
              className="font-outfit text-[10px] uppercase tracking-[.2em] mb-4"
              style={{ opacity: .55 }}
            >
              05 · Le temps
            </p>

            <h2
              className="font-galinoy italic leading-[.85]"
              style={{
                fontSize:
                  'clamp(4rem,13vw,8rem)',
              }}
            >
              Combien
              <br />
              d'heures ?
            </h2>

            <div className="mt-14 space-y-10">

              {allMetrics.map((metric, index) => (
                <div key={metric.label}>

                  <div className="flex items-end justify-between gap-6">

                    <div>
                      <span
                        className="compare-story-number"
                        style={{
                          fontSize:
                            'clamp(4rem,13vw,8rem)',
                          color:
                            index === 0
                              ? palette[2]
                              : '#fff',
                        }}
                      >
                        {formatDuration(
                          metric.totalMinutes
                        )}
                      </span>

                      <p
                        className="font-outfit text-[12px] mt-1"
                        style={{ opacity: .55 }}
                      >
                        {metric.label}
                      </p>
                    </div>

                    <span
                      className="font-outfit text-[12px] text-right"
                      style={{ opacity: .55 }}
                    >
                      {metric.totalFilms} films
                    </span>

                  </div>

                  <div
                    className="mt-5 h-[14px] rounded-full overflow-hidden"
                    style={{
                      backgroundColor:
                        'rgba(255,255,255,.12)',
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: mounted
                          ? `${Math.max(
                              4,
                              (metric.totalMinutes /
                                Math.max(
                                  ...allMetrics.map(
                                    (m) =>
                                      m.totalMinutes
                                  ),
                                  1
                                )) *
                                100
                            )}%`
                          : '0%',
                        backgroundColor:
                          index === 0
                            ? palette[2]
                            : 'rgba(255,255,255,.7)',
                        transition:
                          'width 1s cubic-bezier(.2,.8,.2,1)',
                      }}
                    />
                  </div>

                </div>
              ))}

            </div>

            {secondary && (
              <div className="mt-16 flex items-center gap-5">

                <span
                  className="compare-story-number"
                  style={{
                    fontSize: '4rem',
                    color: palette[2],
                  }}
                >
                  {durationDelta > 0
                    ? '+'
                    : ''}
                  {durationDelta} min
                </span>

                <p
                  className="font-outfit text-[13px] leading-snug"
                  style={{ opacity: .65 }}
                >
                  d'écart sur la durée moyenne
                  d'un film.
                </p>

              </div>
            )}

          </div>
        </section>


        {/* ─────────────────────────────
            06 — AFFICHES
        ───────────────────────────── */}

        <section
          className="compare-story-section px-6 sm:px-10 py-16"
          style={{
            backgroundColor: '#F5F0E8',
          }}
        >
          <div className="max-w-[1000px] mx-auto">

            <div className="flex justify-between items-end gap-6 mb-10">
              <div>
                <p
                  className="font-outfit text-[10px] uppercase tracking-[.2em] mb-4"
                  style={{
                    color: palette[0],
                  }}
                >
                  06 · En images
                </p>

                <h2
                  className="font-galinoy italic leading-[.9]"
                  style={{
                    fontSize:
                      'clamp(3.5rem,11vw,7rem)',
                  }}
                >
                  Ton cinéma.
                </h2>
              </div>

              <span
                className="font-outfit text-[11px]"
                style={{ opacity: .4 }}
              >
                {totalComparedFilms} séances
              </span>
            </div>

            <div className="space-y-14">

              {allMetrics.map((metric, index) => (
                <div key={metric.label}>

                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          palette[index],
                      }}
                    />

                    <span className="font-outfit text-[13px] font-semibold">
                      {metric.label}
                    </span>

                    <span
                      className="font-outfit text-[11px]"
                      style={{ opacity: .4 }}
                    >
                      · {metric.films.length} affiches
                    </span>
                  </div>

                  <PosterStrip
                    metric={metric}
                    color={palette[index]}
                  />

                </div>
              ))}

            </div>

          </div>
        </section>


        {/* ─────────────────────────────
            07 — ÉCONOMIE
        ───────────────────────────── */}

        <section
          className="compare-story-section px-6 sm:px-10 py-20"
          style={{
            backgroundColor: '#151515',
            color: '#FFF8EF',
          }}
        >
          <div className="max-w-[900px] mx-auto">

            <p
              className="font-outfit text-[10px] uppercase tracking-[.2em] mb-4"
              style={{
                color: palette[2],
              }}
            >
              07 · L'économie
            </p>

            <h2
              className="font-galinoy italic leading-[.85]"
              style={{
                fontSize:
                  'clamp(4rem,12vw,8rem)',
              }}
            >
              Chaque séance
              <br />
              compte.
            </h2>

            <div className="grid grid-cols-2 gap-4 mt-14">

              {allMetrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className="p-5 sm:p-8"
                  style={{
                    backgroundColor:
                      index === 0
                        ? palette[0]
                        : 'rgba(255,255,255,.08)',
                  }}
                >
                  <p
                    className="font-outfit text-[10px] uppercase tracking-wider mb-8"
                    style={{ opacity: .55 }}
                  >
                    {metric.label}
                  </p>

                  <span
                    className="compare-story-number"
                    style={{
                      fontSize:
                        'clamp(3rem,8vw,5rem)',
                    }}
                  >
                    {metric.costPerFilm
                      .toFixed(2)
                      .replace('.', ',')}
                    €
                  </span>

                  <p
                    className="font-outfit text-[12px] mt-2"
                    style={{ opacity: .6 }}
                  >
                    par séance
                  </p>
                </div>
              ))}

            </div>

            <div className="mt-10 grid grid-cols-2 gap-10">

              {allMetrics.map((metric) => (
                <div key={metric.label}>

                  <span
                    className="compare-story-number text-[42px]"
                    style={{
                      color: palette[2],
                    }}
                  >
                    {Math.round(
                      metric.savings
                    )}€
                  </span>

                  <p
                    className="font-outfit text-[11px] mt-1"
                    style={{ opacity: .45 }}
                  >
                    économisés sur {metric.label}
                  </p>

                </div>
              ))}

            </div>

          </div>
        </section>


        {/* ─────────────────────────────
            08 — FINAL
        ───────────────────────────── */}

        <section
          className="compare-story-section px-6 sm:px-10 py-24"
          style={{
            background:
              'linear-gradient(135deg, #A78BFA 0%, #F4C95D 100%)',
          }}
        >
          <div className="max-w-[850px] mx-auto">

            <p
              className="font-outfit text-[10px] uppercase tracking-[.2em] mb-6"
              style={{ opacity: .5 }}
            >
              Fin de la comparaison
            </p>

            <h2
              className="font-galinoy italic leading-[.85]"
              style={{
                fontSize:
                  'clamp(4rem,14vw,9rem)',
              }}
            >
              Deux histoires.
            </h2>

            <p
              className="font-outfit text-[21px] sm:text-[28px] leading-[1.25] mt-10 max-w-[700px]"
            >
              {reference.label} et{' '}
              {secondary?.label || 'l’autre période'}{' '}
              racontent deux moments différents de
              ton parcours au cinéma.
            </p>

            <div
              className="mt-12 grid grid-cols-2 gap-6"
            >
              {allMetrics.map((metric, index) => (
                <div key={metric.label}>

                  <span
                    className="compare-story-number"
                    style={{
                      fontSize:
                        'clamp(3rem,9vw,6rem)',
                    }}
                  >
                    {metric.totalFilms}
                  </span>

                  <p className="font-outfit text-[12px] font-semibold">
                    films
                  </p>

                  <p
                    className="font-outfit text-[11px] mt-1"
                    style={{ opacity: .5 }}
                  >
                    {metric.label}
                  </p>

                </div>
              ))}
            </div>

            <div className="mt-16">
              <button
                onClick={onClose}
                className="rounded-full px-7 py-3 font-outfit text-[13px] font-bold"
                style={{
                  backgroundColor:
                    'var(--compare-ink)',
                  color: '#fff',
                }}
              >
                Retour à mon bilan
              </button>
            </div>

          </div>
        </section>

      </main>
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
  onHeaderRight,
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
  const activeYear  = dashValue || (dashView === 'year'  ? availableYears[0]     : '');

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

  const capucinesFilms = dashData.filter(f => f.capucine === true || f.capucine === 1 || String(f.capucine) === '1');
  const capucinesCount = capucinesFilms.length;
  const capucinesTotalForPeriod = getCapucinesTotalForPeriod(dashView, dashView === 'month' ? activeMonth : activeYear, availableYears);
  const isNonCapucinesMonth = dashView === 'month' && capucinesTotalForPeriod === 0;
  const capucinesPct = capucinesTotalForPeriod > 0
    ? Math.min(100, Math.round((capucinesCount / capucinesTotalForPeriod) * 100))
    : 0;

  const monthlyAvg = Math.round(totalFilms / Math.max(1, dashView === 'year' ? getMonthsToCharge(activeYear) : dashView === 'month' ? 1 : Math.max(1, availableYears.length * 12))) || 9;
  const periodLabel = dashView === 'year' ? activeYear : dashView === 'month' ? (() => { const [y, m] = activeMonth.split('-'); return `${monthNames[parseInt(m, 10) - 1]} ${y}`; })() : currentYear;

  const sortedByDate = dashData
    .filter(f => f.affiche || f.titre)
    .sort((a, b) => {
      const p = (d) => { if (!d) return 0; const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd).getTime(); };
      return p(b.date) - p(a.date);
    });

  const latestFour = sortedByDate.slice(0, 24);
  const decoPool = sortedByDate.filter(f => !!f.affiche);
  const decoPoolWithFallback = decoPool.length > 0 ? decoPool : sortedByDate.slice(0, 12);
  const getPoster = (i) => {
    if (!decoPoolWithFallback.length) return null;
    return decoPoolWithFallback[i % decoPoolWithFallback.length] || null;
  };

  const timeFormatted = formatTotalTime(totalMinutes);
  const avgNoteLabel = avgNote < 3 ? 'un critique chevronné' : avgNote <= 4 ? 'un fin connaisseur' : 'très bon public';
  const formatLabel = (val, view) => {
    if (!val) return '';
    if (view === 'year') return val;
    const [yy, mm] = val.split('-');
    return `${monthNames[parseInt(mm, 10) - 1]} ${yy}`;
  };

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

  const handleCompareClick = () => {
    if (dashView === 'all') return;
    setCompareMode('selector');
  };

  const buildAllMetrics = () => {
  const refValue =
    dashView === 'year'
      ? activeYear
      : activeMonth;

  return [
    computeMetrics(
      dashView,
      refValue,
      historyData,
      pricing
    ),

    ...compareSelections.map((value) =>
      computeMetrics(
        dashView,
        value,
        historyData,
        pricing
      )
    ),
  ];
};

  // ── Push filter button to AppHeader right slot ─────────────────────────────
  useEffect(() => {
    if (!onHeaderRight) return;
    onHeaderRight(
      <button
        onClick={() => setShowFilter(true)}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
          dashView !== 'all'
            ? 'border-transparent text-[var(--theme-bg)]'
            : 'border-[var(--theme-border)] text-[var(--theme-text)]'
        }`}
        style={{
          backgroundColor: dashView !== 'all'
            ? 'var(--theme-accent)'
            : 'color-mix(in srgb, var(--theme-text) 8%, transparent)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        {dashView !== 'all' && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[var(--theme-bg)]" />
        )}
      </button>
    );
  }, [dashView, onHeaderRight]);

return (
  <>
    <div className="bg-[var(--theme-bg)] text-[var(--theme-text)] pb-12 relative w-full overflow-x-clip">

      {/* ================================================================
          FILTER DRAWER (version v2, plus complète)
      ================================================================ */}
      {showFilter && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFilter(false)}
          />

          <div
            className="relative bg-[var(--theme-surface)] w-full rounded-t-[28px] p-5 pb-6 flex flex-col border-t border-[var(--theme-border)] max-h-[70vh]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
          >
            <div className="w-10 h-1 bg-[var(--theme-text)] opacity-10 rounded-full self-center mb-5" />

            <div className="flex justify-between items-center mb-5 px-2">
              <div>
                <p className="font-outfit text-[9px] uppercase tracking-[.2em]" style={{ opacity: .4 }}>
                  Explorer ton historique
                </p>
                <h3 className="font-galinoy italic text-3xl">Timeline</h3>
              </div>

              <button
                onClick={() => setShowFilter(false)}
                className="font-outfit text-[12px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--theme-accent)' }}
              >
                Fermer
              </button>
            </div>

            <div className="overflow-y-auto scrollbar-hide px-2">
              <button
                onClick={() => { setDashView('all'); setDashValue(''); setShowFilter(false); }}
                className="w-full py-3 text-left font-outfit text-[16px] border-l-2 pl-4 mb-3"
                style={{
                  borderColor: dashView === 'all' ? 'var(--theme-accent)' : 'color-mix(in srgb, var(--theme-border) 20%, transparent)',
                  color: dashView === 'all' ? 'var(--theme-accent)' : 'var(--theme-text)',
                  opacity: dashView === 'all' ? 1 : .45,
                  fontWeight: dashView === 'all' ? 700 : 500,
                }}
              >
                Bilan global
              </button>

              {availableYears.map((year) => (
                <div key={year} className="border-l-2" style={{ borderColor: 'color-mix(in srgb, var(--theme-border) 20%, transparent)' }}>
                  <button
                    onClick={() => { setDashView('year'); setDashValue(year); setShowFilter(false); }}
                    className="w-full py-2.5 text-left pl-4 font-outfit text-[15px]"
                    style={{
                      color: dashView === 'year' && dashValue === year ? 'var(--theme-accent)' : 'var(--theme-text)',
                      fontWeight: dashView === 'year' && dashValue === year ? 700 : 500,
                      opacity: dashView === 'year' && dashValue === year ? 1 : .55,
                    }}
                  >
                    {year}
                  </button>

                  <div className="flex flex-col mb-3">
                    {availableMonthsRaw.filter((m) => m.startsWith(year)).map((m) => (
                      <button
                        key={m}
                        onClick={() => { setDashView('month'); setDashValue(m); setShowFilter(false); }}
                        className="py-1.5 text-left pl-8 font-outfit text-[13px]"
                        style={{
                          color: dashView === 'month' && dashValue === m ? 'var(--theme-accent)' : 'var(--theme-text)',
                          opacity: dashView === 'month' && dashValue === m ? 1 : .3,
                          fontWeight: dashView === 'month' && dashValue === m ? 700 : 400,
                        }}
                      >
                        {formatLabel(m, 'month')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          01 — HERO
          Grande affiche centrale tap-to-change (v1) + habillage
          éditorial / gradient / gros titre (v2)
      ================================================================ */}
      <section
        className="relative px-6 pt-[calc(var(--header-total-height)+1rem)] pb-14 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, var(--theme-bg) 0%, color-mix(in srgb, var(--theme-accent) 8%, var(--theme-bg)) 100%)',
        }}
      >
        <p
          className="relative z-20 font-outfit text-[10px] uppercase tracking-[.24em] mb-6 text-center"
          style={{ color: 'var(--theme-accent)' }}
        >
          Grand Écran · Carnet de spectateur
        </p>

        {decoPoolWithFallback.length > 0 && (
          <button
            type="button"
            onClick={() => setTopPosterIdx(prev => prev + 1)}
            className="relative block w-[min(72vw,300px)] aspect-[2/3] mx-auto rounded-[22px] overflow-hidden shadow-[0_22px_60px_rgba(0,0,0,0.35)] active:scale-[0.985] transition-transform duration-300 z-10"
          >
            <SmartPoster
              afficheInitiale={decoPoolWithFallback[topPosterIdx % decoPoolWithFallback.length]?.affiche}
              titre={decoPoolWithFallback[topPosterIdx % decoPoolWithFallback.length]?.titre}
              className="w-full h-full object-cover pointer-events-none"
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.24), transparent 35%)' }}
            />

            <span className="absolute bottom-3 right-3 rounded-full px-3 py-1 font-outfit text-[10px] font-medium backdrop-blur-md bg-black/25 text-white">
              toucher pour changer
            </span>
          </button>
        )}

        <div className="relative z-20 mt-10 max-w-[760px] mx-auto text-center">
          <h1
            className="font-galinoy italic leading-[.82] tracking-[-.04em]"
            style={{ fontSize: 'clamp(3.6rem, 16vw, 6.5rem)' }}
          >
            Ton cinéma.
          </h1>

          <p className="font-outfit text-[16px] sm:text-[19px] leading-[1.25] mt-5 max-w-[430px] mx-auto" style={{ opacity: .75 }}>
            {dashView === 'all'
              ? 'Tout ce que racontent tes séances, réunies en une seule histoire.'
              : `Voici ce que raconte ${periodLabel}.`}
          </p>

          <div className="mt-10 flex items-end justify-center gap-3">
            <span
              className="font-galinoy italic leading-[.7]"
              style={{ fontSize: 'clamp(5rem,22vw,9rem)', color: 'var(--theme-accent)' }}
            >
              {totalFilms}
            </span>

            <div className="pb-2 text-left">
              <p className="font-outfit text-[18px] font-semibold">films</p>
              <p className="font-outfit text-[11px] uppercase tracking-[.15em] mt-1" style={{ opacity: .4 }}>
                vus {dashView === 'all' ? 'depuis le début' : `en ${periodLabel}`}
              </p>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'var(--theme-grain-url)', opacity: .08, mixBlendMode: 'multiply' }}
        />
      </section>

      {/* ================================================================
          02 — EN QUELQUES CHIFFRES (tuiles colorées v2)
      ================================================================ */}
      <section className="px-6 py-14" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 8%, var(--theme-bg))' }}>
        <div className="max-w-[820px] mx-auto">
          <p className="font-outfit text-[10px] uppercase tracking-[.2em] mb-6" style={{ opacity: .4 }}>
            En quelques chiffres
          </p>

          <div
            className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px]"
            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-text) 12%, transparent)' }}
          >
            <div className="p-5 sm:p-7" style={{ backgroundColor: 'var(--theme-bg)' }}>
              <span
                className="font-galinoy italic text-[48px] sm:text-[64px] leading-none"
                style={{ color: 'var(--theme-accent)' }}
              >
                {avgNote > 0 ? avgNote.toFixed(1).replace('.', ',') : '—'}
              </span>
              <p className="font-outfit text-[10px] uppercase tracking-wider mt-2" style={{ opacity: .45 }}>
                note moyenne / 5
              </p>
            </div>

            <div className="p-5 sm:p-7" style={{ backgroundColor: 'var(--theme-bg)' }}>
              <span className="font-galinoy italic text-[48px] sm:text-[64px] leading-none">
                {monthlyAvg}
              </span>
              <p className="font-outfit text-[10px] uppercase tracking-wider mt-2" style={{ opacity: .45 }}>
                films / mois
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ================================================================
          03 — DERNIÈRES SÉANCES
      ================================================================ */}
      {latestFour.length > 0 && (
        <section className="py-14">
          <div className="px-6 mb-7">
            <p className="font-outfit text-[10px] uppercase tracking-[.2em] mb-3" style={{ color: 'var(--theme-accent)' }}>
              Dernièrement
            </p>
            <h2 className="font-galinoy italic text-[42px] sm:text-[58px] leading-[.9]">
              Les dernières séances.
            </h2>
          </div>

          <StackedPosters films={latestFour} onSelectFilm={setSelectedFilm} />

          <p className="font-outfit text-[12px] px-6 mt-5" style={{ opacity: .4 }}>
            Ton historique, séance après séance.
          </p>
        </section>
      )}

      <SectionDivider />

      {/* ================================================================
          04 — TEMPS (fond sombre v2 + accent affiche décorative)
      ================================================================ */}
      <section className="relative px-6 py-20 overflow-hidden" style={{ backgroundColor: '#1D2235', color: '#FFF8EF' }}>
        {getPoster(3) && (
          <div
            className="absolute right-[-30px] top-[10%] w-[150px] aspect-[2/3] rounded-[16px] overflow-hidden pointer-events-none"
            style={{ transform: 'rotate(8deg)', opacity: .16 }}
          >
            <SmartPoster
              afficheInitiale={getPoster(3)?.affiche}
              titre={getPoster(3)?.titre}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="relative z-10 max-w-[800px] mx-auto">
          <p className="font-outfit text-[10px] uppercase tracking-[.2em] mb-5" style={{ color: 'var(--compare-yellow, #F4C95D)' }}>
            Le temps
          </p>

          <h2 className="font-galinoy italic leading-[.82]" style={{ fontSize: 'clamp(4rem,14vw,8rem)' }}>
            Dans le noir.
          </h2>

          <p className="font-outfit text-[18px] sm:text-[23px] leading-[1.25] mt-8 max-w-[520px]" style={{ opacity: .7 }}>
            En moyenne, tes films durent
          </p>

          <span
            className="font-galinoy italic leading-none block mt-2"
            style={{ fontSize: 'clamp(4.5rem,17vw,9rem)', color: 'var(--compare-yellow, #F4C95D)' }}
          >
            {formatAvgDuration(avgDuration)}
          </span>

          <div className="mt-14">
            <div className="flex justify-between items-end mb-3">
              <span className="font-outfit text-[10px] uppercase tracking-wider" style={{ opacity: .4 }}>
                Temps cumulé
              </span>
              <span className="font-outfit text-[12px]" style={{ opacity: .6 }}>
                {timeFormatted.value} {timeFormatted.unit}
              </span>
            </div>

            <div className="h-[18px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,.1)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: totalMinutes > 0 ? '100%' : '0%',
                  background: 'linear-gradient(90deg, var(--compare-yellow, #F4C95D), var(--compare-coral, #F05A47))',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          05 — COUPS DE CŒUR (fond rouge, affiches pivotées v2)
      ================================================================ */}
      {coupsDeCoeur.length > 0 && (
        <section className="relative py-16 overflow-hidden" style={{ backgroundColor: '#A31E20', color: '#FFFDF2' }}>
          <div className="px-6 relative z-10">
            <p className="font-outfit text-[10px] uppercase tracking-[.2em] mb-4" style={{ opacity: .65 }}>
              Les films qui restent
            </p>
            <h2 className="font-galinoy italic leading-[.85]" style={{ fontSize: 'clamp(4rem,13vw,7rem)' }}>
              Coups<br />de cœur.
            </h2>
          </div>

          <div className="flex gap-4 px-6 mt-12 overflow-x-auto scrollbar-hide">
            {coupsDeCoeur.map((film, index) => (
              <button
                key={`${film.titre}-${index}`}
                onClick={() => setSelectedFilm(film)}
                className="flex-shrink-0 w-[170px] sm:w-[210px] text-left active:scale-[.97] transition-transform"
              >
                <div
                  className="relative aspect-[2/3] rounded-[16px] overflow-hidden"
                  style={{
                    transform: index % 2 === 0 ? 'rotate(-2deg)' : 'rotate(2deg)',
                    boxShadow: '0 18px 45px rgba(0,0,0,.3)',
                  }}
                >
                  <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />

                  <div
                    className="absolute inset-x-0 bottom-0 p-4"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)' }}
                  >
                    <p className="font-galinoy text-white text-[17px] leading-tight">{film.titre}</p>

                    {film.note && (
                      <span className="inline-flex mt-2 px-2 py-1 rounded-full border border-white/50 font-outfit text-[9px] text-white">
                        {String(film.note).replace('.', ',')}/5
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <SectionDivider />

      {/* ================================================================
          06 — PROFIL (grande affiche v1 + cartes colorées v2)
      ================================================================ */}
      <section className="relative px-6 py-20 overflow-hidden">
        <div className="max-w-[800px] mx-auto">
          <p className="font-outfit text-[10px] uppercase tracking-[.2em] mb-5" style={{ color: 'var(--theme-accent)' }}>
            Ton profil
          </p>

          <h2 className="font-galinoy italic leading-[.86]" style={{ fontSize: 'clamp(3rem,10vw,5.5rem)' }}>
            Un certain goût du cinéma.
          </h2>

          {getPoster(4) && (
            <div className="w-[58vw] max-w-[230px] mx-auto my-10">
              <div
                className="aspect-[2/3] rounded-[18px] overflow-hidden"
                style={{ transform: 'rotate(-3deg)', boxShadow: '0 16px 35px rgba(0,0,0,0.25)' }}
              >
                <SmartPoster afficheInitiale={getPoster(4)?.affiche} titre={getPoster(4)?.titre} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            <div className="p-6 rounded-[22px]" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 9%, transparent)' }}>
              <span className="font-galinoy italic text-[54px] leading-none" style={{ color: 'var(--theme-accent)' }}>
                {formatAvgDuration(avgDuration)}
              </span>
              <p className="font-outfit text-[12px] leading-relaxed mt-3" style={{ opacity: .55 }}>
                durée moyenne d'un film.
              </p>

              {durationDeltaPct !== 0 && (
                <p className="font-outfit text-[13px] mt-5">
                  <strong>{Math.abs(durationDeltaPct)}%</strong>{' '}
                  {durationDeltaPct >= 0 ? 'plus long' : 'plus court'} que ta période précédente.
                </p>
              )}
            </div>

            <div className="p-6 rounded-[22px]" style={{ backgroundColor: 'color-mix(in srgb, #6E8CFF 10%, transparent)' }}>
              <span className="font-galinoy italic text-[54px] leading-none" style={{ color: '#6E8CFF' }}>
                {voPct}%
              </span>
              <p className="font-outfit text-[12px] leading-relaxed mt-3" style={{ opacity: .55 }}>
                de tes séances en version originale étrangère.
              </p>
              <p className="font-outfit text-[14px] font-semibold mt-5">Hello. Ciao. Guten Tag.</p>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ================================================================
          07 — SALLE & SIÈGE (affiche v1 + cartes colorées v2)
      ================================================================ */}
      {(topRoom || favoriteSeat) && (
        <section className="relative px-6 py-20 overflow-hidden" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-text) 4%, var(--theme-bg))' }}>
          <div className="max-w-[820px] mx-auto">
            <p className="font-outfit text-[10px] uppercase tracking-[.2em] mb-5" style={{ color: 'var(--theme-accent)' }}>
              Tes habitudes
            </p>

            <h2 className="font-galinoy italic leading-[.86]" style={{ fontSize: 'clamp(3rem,10vw,5.5rem)' }}>
              Tu as tes petites habitudes.
            </h2>

            {getPoster(5) && (
              <div className="w-[48vw] max-w-[190px] mx-auto mt-10 mb-4">
                <div
                  className="aspect-[2/3] rounded-[18px] overflow-hidden"
                  style={{ transform: 'rotate(4deg)', boxShadow: '0 16px 35px rgba(0,0,0,0.25)' }}
                >
                  <SmartPoster afficheInitiale={getPoster(5)?.affiche} titre={getPoster(5)?.titre} className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <div className="mt-10 relative min-h-[350px]">
              {topRoom && (
                <div
                  className="absolute left-0 top-0 w-[72%] sm:w-[55%] p-7 rounded-[24px]"
                  style={{ backgroundColor: '#F4C95D', color: '#151515', transform: 'rotate(-2deg)' }}
                >
                  <p className="font-outfit text-[9px] uppercase tracking-[.18em] opacity-50">Ta salle</p>
                  <p className="font-galinoy italic text-[46px] sm:text-[58px] leading-[.9] mt-4">{topRoom[0]}</p>
                  <p className="font-outfit text-[12px] mt-5 max-w-[220px]" style={{ opacity: .65 }}>
                    {roomSharePct}% de tes séances ont eu lieu ici.
                  </p>
                </div>
              )}

              {favoriteSeat && (
                <div
                  className="absolute right-0 bottom-0 w-[62%] sm:w-[45%] p-7 rounded-[24px]"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-bg)', transform: 'rotate(2deg)' }}
                >
                  <p className="font-outfit text-[9px] uppercase tracking-[.18em] opacity-60">Ton siège</p>
                  <p className="font-galinoy italic text-[56px] leading-none mt-3">{favoriteSeat[0]}</p>
                  <p className="font-outfit text-[12px] mt-4 opacity-70">
                    Ton poste préféré, séance après séance.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================
          08 — JOUR FAVORI (fond bleu v2 + affiche)
      ================================================================ */}
      {favDay !== '--' && (
        <>
          <SectionDivider />

          <section className="relative px-6 py-20 overflow-hidden" style={{ backgroundColor: '#6E8CFF', color: '#fff' }}>
            <div className="max-w-[800px] mx-auto">
              <p className="font-outfit text-[10px] uppercase tracking-[.2em] mb-5" style={{ opacity: .55 }}>
                Le rendez-vous
              </p>

              <h2 className="font-galinoy italic leading-[.82]" style={{ fontSize: 'clamp(4rem,14vw,8rem)' }}>
                Le {favDay}.
              </h2>

              <p className="font-outfit text-[19px] sm:text-[24px] leading-[1.2] mt-8 max-w-[550px]">
                Il semblerait que ce soit le jour où tu trouves le plus souvent le chemin du cinéma.
              </p>

              <div className="inline-flex items-center gap-4 mt-10 rounded-full px-5 py-3" style={{ backgroundColor: 'rgba(255,255,255,.12)' }}>
                <div>
                  <p className="font-outfit text-[10px] uppercase tracking-wider" style={{ opacity: .55 }}>
                    Horaire préféré
                  </p>
                  <p className="font-galinoy italic text-[28px] leading-none mt-1">{favTime}</p>
                </div>
              </div>

              {lastFilmOnFavDay && (
                <button
                  type="button"
                  onClick={() => setSelectedFilm(lastFilmOnFavDay)}
                  className="block mt-12 w-[180px] sm:w-[210px] aspect-[2/3] rounded-[16px] overflow-hidden ml-auto"
                  style={{ transform: 'rotate(3deg)', boxShadow: '0 25px 50px rgba(0,0,0,.25)' }}
                >
                  <SmartPoster
                    afficheInitiale={lastFilmOnFavDay.affiche}
                    titre={lastFilmOnFavDay.titre}
                    className="w-full h-full object-cover"
                  />
                </button>
              )}
            </div>
          </section>
        </>
      )}

      <SectionDivider />

      {/* ================================================================
          09 — CAPUCINES
      ================================================================ */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#7E0000', color: '#FFFDF2' }}>
        <div className="px-6 pt-16 pb-14 max-w-[900px] mx-auto">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="font-outfit text-[10px] uppercase tracking-[.2em] mb-4" style={{ opacity: .55 }}>
                Une programmation à part
              </p>
              <h2 className="font-galinoy italic leading-[.82]" style={{ fontSize: 'clamp(4rem,13vw,7rem)' }}>
                Capucines.
              </h2>
            </div>

            <div className="flex-shrink-0 w-[72px] h-[72px] sm:w-[90px] sm:h-[90px] rounded-full bg-white overflow-hidden">
              <img src="https://i.imgur.com/lg1bkrO.png" alt="Logo Capucines" className="w-full h-full object-contain p-2" />
            </div>
          </div>

          {isNonCapucinesMonth ? (
            <div className="mt-12 max-w-[470px]">
              <span className="font-galinoy italic text-[80px] leading-none" style={{ color: 'rgba(255,255,255,.2)' }}>
                0
              </span>
              <p className="font-outfit text-[18px] leading-snug mt-2" style={{ opacity: .65 }}>
                film de la sélection sur cette période.
              </p>
              <p className="font-outfit text-[12px] leading-relaxed mt-5" style={{ opacity: .4 }}>
                La programmation Capucines se tient de juin à novembre.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-12">
                <span
                  className="font-galinoy italic leading-none"
                  style={{ fontSize: 'clamp(5rem,18vw,9rem)', color: 'var(--theme-accent)' }}
                >
                  {capucinesCount}
                </span>
                <span className="font-outfit text-[20px] ml-3" style={{ opacity: .7 }}>/ 6</span>
              </div>

              <p className="font-outfit text-[18px] leading-snug mt-4 max-w-[470px]">
                film{capucinesCount > 1 ? 's' : ''} de la sélection vus
                {dashView === 'all' ? ' au total' : ` en ${periodLabel}`}.
              </p>

              {capucinesTotalForPeriod > 0 && (
                <p className="font-outfit text-[13px] leading-relaxed mt-5 max-w-[450px]" style={{ opacity: .65 }}>
                  Cela représente <strong style={{ color: '#fff' }}>{capucinesPct}%</strong> de la sélection disponible sur cette période.
                </p>
              )}

              {capucinesFilms.length > 0 && (
                <div className="mt-10 -mx-6">
                  <StackedPosters films={capucinesFilms.slice(0, 200)} onSelectFilm={setSelectedFilm} />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ================================================================
          10 — ARGENT
      ================================================================ */}
      <section className="relative px-6 py-20 overflow-hidden" style={{ backgroundColor: '#151515', color: '#FFF8EF' }}>
        <div className="max-w-[800px] mx-auto">
          <p className="font-outfit text-[10px] uppercase tracking-[.2em] mb-5" style={{ color: 'var(--compare-yellow, #F4C95D)' }}>
            L'addition
          </p>

          <h2 className="font-galinoy italic leading-[.84]" style={{ fontSize: 'clamp(4rem,13vw,8rem)' }}>
            Combien coûte<br />ta passion ?
          </h2>

          <p className="font-outfit text-[18px] leading-snug mt-8 max-w-[500px]" style={{ opacity: .65 }}>
            Avec ton Cinépass, chaque séance revient à seulement
          </p>

          <div className="mt-3">
            <span
              className="font-galinoy italic leading-none"
              style={{ fontSize: 'clamp(5rem,18vw,9rem)', color: 'var(--compare-yellow, #F4C95D)' }}
            >
              {costPerFilm.toFixed(2).replace('.', ',')}€
            </span>
            <span className="font-outfit text-[13px] ml-2" style={{ opacity: .45 }}>/ séance</span>
          </div>

          {savings > 0 && (
            <div className="mt-12 p-6 rounded-[22px]" style={{ backgroundColor: 'rgba(255,255,255,.07)' }}>
              <p className="font-outfit text-[14px] leading-relaxed" style={{ opacity: .7 }}>
                Sans abonnement, tes séances auraient coûté environ
              </p>

              <div className="flex items-baseline gap-3 mt-3">
                <span className="font-galinoy italic text-[44px]">{totalStandardValue.toFixed(0)}€</span>
                <span className="font-outfit text-[12px]" style={{ opacity: .4 }}>
                  contre {totalSubCost.toFixed(0)}€
                </span>
              </div>

              <p className="font-outfit text-[12px] mt-4" style={{ opacity: .45 }}>
                Soit environ{' '}
                <strong style={{ color: 'var(--compare-yellow, #F4C95D)' }}>
                  {Math.round((savings / Math.max(totalStandardValue, 1)) * 100)}%
                </strong>{' '}
                de différence.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================
          11 — FINAL / COMPARAISON
      ================================================================ */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-[650px] mx-auto">
          <p className="font-outfit text-[10px] uppercase tracking-[.22em] mb-5" style={{ color: 'var(--theme-accent)' }}>
            Et maintenant ?
          </p>

          <h2 className="font-galinoy italic leading-[.82]" style={{ fontSize: 'clamp(4rem,14vw,8rem)' }}>
            Une période<br />n'existe jamais<br />toute seule.
          </h2>

          <p className="font-outfit text-[17px] sm:text-[20px] leading-[1.3] mt-9 mx-auto max-w-[500px]" style={{ opacity: .6 }}>
            Sélectionne une autre période et découvre ce qui change dans ta façon de vivre le cinéma.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="font-outfit text-[10px] uppercase tracking-[.18em]" style={{ opacity: .35 }}>
              {dashView === 'all' ? 'Choisis une période pour commencer' : `Période · ${periodLabel}`}
            </p>

            <button
              onClick={handleCompareClick}
              disabled={dashView === 'all'}
              className="rounded-full px-10 py-4 font-outfit text-[14px] font-bold active:scale-95 transition-transform"
              style={{
                backgroundColor: dashView === 'all' ? 'color-mix(in srgb, var(--theme-text) 8%, transparent)' : 'var(--theme-accent)',
                color: dashView === 'all' ? 'color-mix(in srgb, var(--theme-text) 30%, transparent)' : 'var(--theme-bg)',
                cursor: dashView === 'all' ? 'not-allowed' : 'pointer',
              }}
            >
              Comparer cette période
            </button>
          </div>
        </div>
      </section>

    </div>

    {/* ================================================================
        OVERLAYS
    ================================================================ */}
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
        setSelectedFilm={setSelectedFilm}
        onClose={() => { setCompareMode(false); setCompareSelections([]); }}
      />
    )}
  </>
);
}