import { useState } from 'react';
import { SmartPoster } from '../components/SmartPoster';
import { Ticket, Clock, SlidersHorizontal } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────
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

// ── Icons ──────────────────────────────────────────────────────────────────
const ChubbyHeart = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const SeatIcon = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" strokeLinecap="round" />
    <path d="M2 14h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z" />
    <path d="M6 14v-4" strokeLinecap="round" />
    <path d="M18 14v-4" strokeLinecap="round" />
  </svg>
);

const DoorIcon = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4 22H2v-2h2V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16h2v2h-2H4zm2-2h12V4H6v16zm8-9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"></line>
    <line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line>
    <line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y1="14"></line>
    <line x1="9" y1="8" x2="15" y2="8"></line>
    <line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>
);

const MoonIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 drop-shadow-md">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const SunIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 drop-shadow-md">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────
export function Dashboard({
  historyData,
  pricing,
  userName,
  setSelectedFilm,
}) {
  const [dashView, setDashView] = useState('all');
  const [dashValue, setDashValue] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
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

  // ── Core metrics ──
  const totalFilms = dashData.length;
  const notes = dashData.map((f) => parseFloat(String(f.note).replace(',', '.'))).filter((n) => !isNaN(n) && n > 0);
  const avgNote = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;
  
  const durations = dashData.map((f) => parseDuration(f.duree));
  const totalMinutes = durations.reduce((a, b) => a + b, 0);
  const avgDuration = durations.length > 0 ? Math.round(totalMinutes / durations.length) : 0;

  // ── Language ──
  let vfCount = 0, voCount = 0;
  dashData.forEach((f) => {
    const l = (f.langue || 'VF').toUpperCase().trim();
    if (l === 'VF' || l === 'FRA' || l === 'VFQ') vfCount++;
    else voCount++;
  });
  const totalLang = vfCount + voCount;
  const voPct = totalLang > 0 ? Math.round((voCount / totalLang) * 100) : 0;

  // ── Habits ──
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

  // ── Finance ──
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

  // ── Delta logic ──
  const getPreviousPeriodAvgDuration = () => {
    if (dashView === 'year') {
      const idx = availableYears.indexOf(activeYear);
      if (idx >= availableYears.length - 1) return null;
      const prevYear = availableYears[idx + 1];
      const prevFilms = historyData.filter(f => f.date?.endsWith(prevYear));
      if (prevFilms.length === 0) return null;
      const prevDurs = prevFilms.map(f => parseDuration(f.duree));
      return Math.round(prevDurs.reduce((a, b) => a + b, 0) / prevDurs.length);
    }
    if (dashView === 'month') {
      const idx = availableMonthsRaw.indexOf(activeMonth);
      if (idx >= availableMonthsRaw.length - 1) return null;
      const prevMonth = availableMonthsRaw[idx + 1];
      const [py, pm] = prevMonth.split('-');
      const prevFilms = historyData.filter(f => f.date?.endsWith(`${pm}/${py}`));
      if (prevFilms.length === 0) return null;
      const prevDurs = prevFilms.map(f => parseDuration(f.duree));
      return Math.round(prevDurs.reduce((a, b) => a + b, 0) / prevDurs.length);
    }
    return null;
  };
  const prevAvgDuration = getPreviousPeriodAvgDuration();
  const durationDeltaPct = prevAvgDuration ? Math.round(((avgDuration - prevAvgDuration) / prevAvgDuration) * 100) : 12;

  // ── Coups de cœur (Favorites) ──
  const coupsDeCoeur = dashData
    .filter(f => {
      const isCoupDeCoeur = f.coupDeCoeur === true || f.coupDeCoeur === 'OUI' || f.coupDeCoeur === 1;
      const note = parseFloat(String(f.note || '0').replace(',', '.'));
      return isCoupDeCoeur || note >= 4.5;
    })
    .sort((a, b) => {
      const parseDate = (d) => {
        if (!d) return 0;
        const [dd, mm, yy] = d.split('/').map(Number);
        return new Date(yy, mm - 1, dd).getTime();
      };
      return parseDate(b.date) - parseDate(a.date);
    })
    .slice(0, 2);

  // ── Context data ──
  const monthlyAvg = Math.round(totalFilms / Math.max(1, dashView === 'year' ? getMonthsToCharge(activeYear) : 1)) || 9;
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const periodLabel = dashView === 'year' ? activeYear
    : dashView === 'month' ? (() => { const [y, m] = activeMonth.split('-'); return `${monthNames[parseInt(m, 10) - 1]} ${y}`; })()
    : currentYear;

  const lastFilmOnFavDay = dashData
    .filter(f => {
      if (!f.date) return false;
      const [d, m, y] = f.date.split('/');
      const obj = new Date(y, m - 1, d);
      if (isNaN(obj)) return false;
      const dayMatch = obj.getDay() === favDayIndex;
      if (!f.heure) return dayMatch;
      const h = parseInt(f.heure.split(':')[0], 10);
      const timeSlot = h < 12 ? 'Matin' : h < 18 ? 'Après-midi' : h < 22 ? 'Soirée' : 'Nuit';
      return dayMatch && timeSlot === favTime;
    })
    .sort((a, b) => {
      const p = (d) => { const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd); };
      return p(b.date) - p(a.date);
    })[0] || null;

  const seatSharePct = favoriteSeat && totalFilms > 0 ? Math.round((favoriteSeat[1] / totalFilms) * 100) : 38;
  const roomSharePct = topRoom && totalFilms > 0 ? Math.round((topRoom[1] / totalFilms) * 100) : 14;
  
  const latestFour = dashData.filter(f => f.affiche || f.titre)
    .sort((a, b) => {
      const p = (d) => { if(!d) return 0; const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd).getTime(); };
      return p(b.date) - p(a.date);
    })
    .slice(0, 4);

  const formatLabel = (val, view) => {
    if (!val) return '';
    if (view === 'year') return val;
    const [yy, mm] = val.split('-');
    return `${monthNames[parseInt(mm, 10) - 1]} ${yy}`;
  };

  const scrolled = scrollY > 20;
  

  return (
    <div
      className="bg-[var(--theme-bg)] h-[100dvh] overflow-x-hidden text-[var(--theme-text)] pb-8 relative w-full"
      onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}
    >
      
      {/* ── STICKY HEADER ── */}
<header
        className="sticky top-0 z-50 flex justify-between items-center px-8 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-2 transition-all duration-300"
        style={{
          backgroundColor: `color-mix(in srgb, var(--theme-bg) ${scrolled ? 90 : 0}%, transparent)`,
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        }}
      >
        <div className="flex flex-col justify-center">
          <div
            className="transition-all duration-300"
            style={{
              height: scrolled ? '0px' : '22px',
              opacity: Math.max(0, 1 - scrollY / 60),
              overflow: 'hidden',
            }}
          >
            <span className="font-outfit text-[var(--theme-text)] text-base tracking-wide leading-none">
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
                ? 'bg-[var(--theme-accent)] border-transparent text-[var(--theme-bg)]'
                : 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)]'
            }`}
          >
            <SlidersHorizontal size={16} />
            {dashView !== 'all' && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[var(--theme-bg)]" />
            )}
          </button>
        </div>
      </header>

      {/* ── FILTER DRAWER ── */}
      {showFilter && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowFilter(false)} 
          />
          <div className="relative bg-[var(--theme-surface)] w-full rounded-t-[24px] p-5 pb-6 flex flex-col animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-[var(--theme-border)] max-h-[55vh]">
            <div className="w-10 h-1 bg-[var(--theme-text)] opacity-10 rounded-full self-center mb-4" />
            
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-outfit text-[var(--theme-text)] font-bold text-lg italic">Timeline</h3>
              <button onClick={() => setShowFilter(false)} className="text-[var(--theme-accent)] font-outfit text-sm font-bold">OK</button>
            </div>
            
            <div className="overflow-y-auto scrollbar-hide flex flex-col px-4">
              
              <button 
                onClick={() => { setDashView('all'); setDashValue(''); setShowFilter(false); }}
                className={`py-3 text-left font-outfit text-[16px] transition-all border-l-2 pl-4 mb-2 ${dashView === 'all' ? 'border-[var(--theme-accent)] text-[var(--theme-accent)] font-bold' : 'border-[var(--theme-border)]/20 text-[var(--theme-text)] opacity-40'}`}
              >
                Bilan Global
              </button>

              {availableYears.map(year => (
                <div key={year} className="flex flex-col border-l-2 border-[var(--theme-border)]/20 ml-0">
                  <button 
                    onClick={() => { setDashView('year'); setDashValue(year); setShowFilter(false); }}
                    className={`py-2 text-left pl-4 font-outfit text-[15px] transition-all ${dashView === 'year' && dashValue === year ? 'text-[var(--theme-accent)] font-bold' : 'text-[var(--theme-text)] opacity-60 font-medium'}`}
                  >
                    {year}
                  </button>

                  <div className="flex flex-col mb-2">
                    {availableMonthsRaw
                      .filter(m => m.startsWith(year))
                      .map(m => (
                        <button 
                          key={m}
                          onClick={() => { setDashView('month'); setDashValue(m); setShowFilter(false); }}
                          className={`py-1.5 text-left pl-8 font-outfit text-[14px] relative transition-all ${dashView === 'month' && dashValue === m ? 'text-[var(--theme-accent)] font-bold' : 'text-[var(--theme-text)] opacity-30'}`}
                        >
                          <div className={`absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full ${dashView === 'month' && dashValue === m ? 'bg-[var(--theme-accent)] scale-150' : 'bg-[var(--theme-border)]'}`} />
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

      {/* ── MAIN CONTENT ── */}
      <main className="flex flex-col gap-16 mt-4">
        
        {/* SECTION 1 — HERO STAT */}
        <div className="px-6 flex flex-col">
          <div className="flex items-baseline gap-3 flex-wrap">
            {dashView === 'all' ? (
              <span className="font-outfit text-[var(--theme-text)] text-xl">
                Avec ton <span className="font-bold">Cinépass</span>, tu as vu
              </span>
            ) : (
              <span className="font-outfit text-[var(--theme-text)] text-xl">
                En <span className="font-bold">{periodLabel}</span>, tu as vu
              </span>
            )}
            <span className="font-galinoy italic text-[var(--theme-accent)] text-[80px] leading-[0.8] tracking-tighter">
              {totalFilms}
            </span>
            <span className="font-outfit text-[var(--theme-text)] text-xl font-medium">films.</span>
          </div>
          <p className="font-outfit text-xs text-[var(--theme-text)] opacity-60 mt-3">
            Cela représente {Math.round(totalMinutes / (60 * 24 * 7))} semaines dans l'obscurité, quel dévouement !
          </p>
        </div>

        {/* SECTION 2 — MONTHLY FREQUENCY */}
        <div className="px-6 relative flex justify-between items-center overflow-hidden h-32">
          <div className="z-10 flex flex-col">
            <p className="font-outfit text-[var(--theme-text)] text-[15px]">Tu t'es rendu au ciné</p>
            <div className="flex flex-col items-center w-fit ml-8 mt-2">
              <span className="font-galinoy italic text-[var(--theme-accent)] text-[64px] leading-none">
                {monthlyAvg}
              </span>
              <p className="font-outfit text-[10px] text-[var(--theme-text)] opacity-60 mt-1">fois par mois en moyenne</p>
            </div>
          </div>
          <Ticket size={180} className="absolute -right-8 text-[var(--theme-text)] opacity-5 rotate-[-15deg] pointer-events-none" strokeWidth={1} />
        </div>

        {/* SECTION 3 — LAST SESSIONS */}
        {latestFour.length > 0 && (
          <div className="flex flex-col items-center w-full">
            <p className="font-outfit text-[var(--theme-text)] text-base mb-6 px-6 self-start w-full text-center">Tes dernières séances</p>
            
            <div className="w-full overflow-hidden flex justify-center py-2">
              <div className="w-[130%] max-w-[600px] flex justify-center gap-3 px-[4vw]">
                {latestFour.map((film, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFilm(film)}
                    className="w-1/4 aspect-[2/3] bg-[var(--theme-surface)] rounded-2xl overflow-hidden relative shadow-lg active:scale-95 transition-transform"
                  >
                    <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
                    {film.note && (
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center border border-white/10">
                        <span className="text-[10px] font-outfit font-bold text-white leading-none">{film.note.toString().replace('.', ',')}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {avgNote > 0 && (
              <p className="font-outfit text-[11px] text-[var(--theme-text)] opacity-60 mt-6 text-center px-8 leading-relaxed">
                Avec une note moyenne de <span className="font-bold text-[var(--theme-accent)]">{avgNote.toFixed(1).replace('.', ',')}/5</span>, tu es ce qu'on appelle<br/>
                <span className="font-bold text-[var(--theme-text)] text-xs">un fin connaisseur !</span>
              </p>
            )}
          </div>
        )}

        {/* SECTION 4 — COUPS DE CŒUR */}
        {coupsDeCoeur.length > 0 && (
          <div className="px-6">
            <p className="font-outfit text-[var(--theme-text)] text-base text-right mb-6">Tes derniers coups de coeur</p>
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-3 justify-center w-12 pt-4">
                <ChubbyHeart className="w-10 h-10 text-[var(--theme-text)]" />
                <ChubbyHeart className="w-8 h-8 text-[var(--theme-text)] opacity-60 -ml-2" />
                <ChubbyHeart className="w-6 h-6 text-[var(--theme-text)] opacity-30 ml-2" />
              </div>
              <div className="flex gap-4 flex-1">
                {coupsDeCoeur.map((film, i) => (
                  <div key={i} className="flex-1 flex flex-col">
                    <div className="w-full aspect-[2/3] bg-gradient-to-b from-[#E0E0E0] to-[#A0A0A0] rounded-[24px] overflow-hidden shadow-lg relative">
                      <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
                      {film.note && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <span className="text-[9px] font-outfit font-black text-black">
                            {film.note.toString().replace('.', ',')}
                          </span>
                          <svg className="w-2.5 h-2.5 text-[var(--theme-accent)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </div>
                      )}
                    </div>
                    <p className="font-galinoy italic text-[var(--theme-text)] mt-3 text-center text-[15px] leading-tight break-words px-1">
                      {film.titre}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5 — AVERAGE DURATION */}
        <div className="px-6 relative h-40 flex items-center">
          <Clock size={220} className="absolute -right-16 top-1/2 -translate-y-1/2 text-[var(--theme-text)] opacity-5 pointer-events-none" strokeWidth={1} />
          <div className="z-10 relative flex flex-col">
            <p className="font-outfit text-[var(--theme-text)] text-[15px] leading-snug">
              En moyenne, les films que<br/>tu vas voir durent
            </p>
            <span className="font-galinoy italic text-[var(--theme-accent)] text-[72px] leading-none mt-2">
              {formatAvgDuration(avgDuration)}
            </span>
            <p className="font-outfit text-[10px] text-[var(--theme-text)] opacity-60 w-[60%] mt-3 leading-relaxed">
              C'est <span className="font-bold text-[var(--theme-text)]">{Math.abs(durationDeltaPct)}% {durationDeltaPct >= 0 ? 'plus long' : 'plus court'}</span> que la période précédente. On ne t'arrête plus !
            </p>
          </div>
        </div>

        {/* SECTION 6 — LANGUAGE */}
        <div className="px-6 flex items-center gap-6">
          <span className="font-galinoy italic text-[var(--theme-accent)] text-[80px] leading-none flex-shrink-0">
            {voPct}%
          </span>
          <div className="flex flex-col">
            <p className="font-outfit text-[var(--theme-text)] font-bold text-[17px] mb-2 leading-tight">Hello! Ciao! Salut ! Guten Tag!</p>
            <p className="font-outfit text-[13px] text-[var(--theme-text)] opacity-80 leading-snug">
              Sur la période, tu as vu {voPct}% de films en version originale étrangère. Un vrai cinéphile du monde !
            </p>
          </div>
        </div>

        {/* SECTION 7 — FAVORITE ROOM */}
        {topRoom && (
          <div className="px-6 flex items-center relative h-32">
            <DoorIcon size={160} className="text-[var(--theme-text)] opacity-5 absolute -left-12" />
            <div className="ml-auto w-2/3 flex flex-col items-start">
              <p className="font-outfit text-[var(--theme-text)] text-[15px]">C'est en</p>
              <span className="font-galinoy italic text-[var(--theme-accent)] text-[42px] leading-none mt-1 block">
                {topRoom[0]}
              </span>
              <p className="font-outfit text-[var(--theme-text)] text-[13px] mt-1">où tu as passé le plus de temps.</p>
              <p className="font-outfit text-[9px] text-[var(--theme-text)] opacity-60 mt-3 leading-relaxed w-4/5">
                Elle représente <span className="font-bold text-[var(--theme-text)]">{roomSharePct}%</span> de tes réservations.<br/>The place to be !
              </p>
            </div>
          </div>
        )}

        {/* SECTION 8 — FAVORITE SEAT */}
        {favoriteSeat && (
          <div className="px-6 relative flex justify-between items-center h-32">
            <div className="z-10 w-2/3 flex flex-col items-end text-right">
              <p className="font-outfit text-[var(--theme-text)] text-[15px]">Tu adores t'asseoir en</p>
              <span className="font-galinoy italic text-[var(--theme-accent)] text-[48px] leading-none mt-1 block">
                {favoriteSeat[0]}
              </span>
              <p className="font-outfit text-[9px] text-[var(--theme-text)] opacity-60 mt-3 leading-relaxed w-5/6">
                Cela correspond à <span className="font-bold text-[var(--theme-text)]">{seatSharePct}%</span> de tes séances à cette place. Ta deuxième maison en somme !
              </p>
            </div>
            <SeatIcon size={160} className="text-[var(--theme-text)] opacity-5 absolute -right-10" />
          </div>
        )}

        {/* SECTION 9 — FAVORITE DAY */}
        {favDay !== '--' && (
          <div className="px-6">
            <p className="font-outfit text-[var(--theme-text)] text-[15px] mb-8 leading-snug">
              Après analyse... Il semblerait que tu trouves le plus souvent le chemin du cinéma
            </p>
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-[var(--theme-text)] opacity-5 flex items-center justify-center">
                  {favTime === 'Matin' || favTime === 'Après-midi' ? <SunIcon /> : <MoonIcon />}
                </div>
                <div className="flex flex-col">
                  <span className="font-outfit font-bold text-[var(--theme-text)] text-[22px] leading-none">Le {favDay}</span>
                  <span className="font-outfit font-bold text-[var(--theme-accent)] text-[14px] mt-1">en {favTime.toLowerCase()}</span>
                </div>
              </div>
              
              {lastFilmOnFavDay && (
                <div className="flex flex-col items-end max-w-[120px]">
                  <p className="font-outfit text-[9px] text-[var(--theme-text)] opacity-60 mb-2 text-right leading-tight">
                    Ta dernière séance sur ce créneau c'était pour :
                  </p>
                  <div className="w-[72px] h-[100px] bg-[#E0E0E0] rounded-lg overflow-hidden shadow-md">
                    <SmartPoster afficheInitiale={lastFilmOnFavDay.affiche} titre={lastFilmOnFavDay.titre} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-galinoy text-[var(--theme-text)] text-[11px] mt-2 italic font-bold">
                    {lastFilmOnFavDay.date}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 10 — FINANCE */}
        <div className="px-6">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col flex-1 pb-1">
              <p className="font-outfit text-[var(--theme-text)] text-[15px] leading-snug">
                Tu as fait le bon choix en prenant un Cinépass.<br/>
                Avec ton abonnement,<br/>une séance te revient à :
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="font-galinoy italic text-[var(--theme-accent)] text-[56px] leading-[0.8] block">
                {costPerFilm.toFixed(2).replace('.', ',')}€
              </span>
            </div>
          </div>
          <p className="font-outfit text-[10px] text-[var(--theme-text)] opacity-60 mt-6 leading-relaxed">
            Sans abonnement, tu aurais dépensé <span className="font-bold text-[var(--theme-text)]">{totalStandardValue.toFixed(0)}€</span> sur la période (au lieu de <span className="font-bold text-[var(--theme-text)]">{totalSubCost.toFixed(0)}€</span>). Cela représente une économie de <span className="font-bold text-[var(--theme-text)]">{Math.round((savings / totalStandardValue) * 100)}%</span> ! Une affaire !
          </p>
        </div>

        {/* SECTION 11 — COMPARE */}
        <div className="px-6 pb-8 text-center flex flex-col items-center">
          <p className="font-outfit text-[var(--theme-text)] text-[17px] mb-8 leading-snug">
            Quelle aventure que cette période <span className="font-bold">{dashView === 'all' ? 'Global' : periodLabel}</span> !<br/>
            Tu veux la comparer avec une autre ?
          </p>
          <button 
            onClick={() => console.log('Compare clicked')}
            className="border border-[var(--theme-text)] text-[var(--theme-text)] rounded-full px-10 py-2.5 font-outfit text-[15px] active:scale-95 transition-transform"
          >
            Comparer
          </button>
        </div>
        
      </main>
    </div>
  );
}