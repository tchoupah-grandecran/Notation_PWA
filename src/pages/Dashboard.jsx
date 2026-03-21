import { useState } from 'react';
import {
  LineChart, Line, ComposedChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { SmartPoster } from '../components/SmartPoster';

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

const parseDateToMs = (dateStr, heureStr) => {
  if (!dateStr) return 0;
  const [day, month, year] = dateStr.split('/');
  const d = new Date(year, month - 1, day);
  if (heureStr) {
    const [h, m] = heureStr.replace('h', ':').split(':');
    d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0);
  }
  return d.getTime();
};

const getMondayTimestamp = (d) => {
  const dObj = new Date(d);
  const day = dObj.getDay();
  const diff = dObj.getDate() - day + (day === 0 ? -6 : 1);
  dObj.setDate(diff);
  dObj.setHours(0, 0, 0, 0);
  return dObj.getTime();
};

const chartTooltipFormatter = (value, name) => {
  if (typeof value !== 'number') return [value, name];
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
  if (name === 'Valeur Billets' || name === 'Coût Abo') return [`${rounded}€`, name];
  return [rounded, name];
};

// ── Sous-composant : Streak ─────────────────────────────────────────────────

function StreakCard({ historyData }) {
  const [showDetails, setShowDetails] = useState(false);

  const activeWeeks = new Set();
  historyData.forEach((film) => {
    if (film.date) {
      const [day, month, year] = film.date.split('/');
      const dateObj = new Date(year, month - 1, day);
      if (!isNaN(dateObj)) activeWeeks.add(getMondayTimestamp(dateObj));
    }
  });

  const sortedWeeks = Array.from(activeWeeks).sort();
  const allStreaks = [];
  let tempStart = null, tempEnd = null, tempCount = 0;

  sortedWeeks.forEach((w) => {
    if (tempCount === 0) {
      tempStart = w; tempEnd = w; tempCount = 1;
    } else {
      const diffDays = Math.round((w - tempEnd) / (1000 * 3600 * 24));
      if (diffDays === 7) { tempEnd = w; tempCount++; }
      else { allStreaks.push({ start: tempStart, end: tempEnd, count: tempCount }); tempStart = w; tempEnd = w; tempCount = 1; }
    }
  });
  if (tempCount > 0) allStreaks.push({ start: tempStart, end: tempEnd, count: tempCount });

  if (allStreaks.length === 0) return null;

  const todayObj = new Date();
  const currentMondayTime = getMondayTimestamp(todayObj);
  const lastMondayTime = currentMondayTime - 7 * 24 * 3600 * 1000;

  let currentStreakObj = null;
  let pastStreaks = [...allStreaks];
  const last = allStreaks[allStreaks.length - 1];
  if (last.end === currentMondayTime || last.end === lastMondayTime) {
    currentStreakObj = last;
    pastStreaks.pop();
  }

  const streakCount = currentStreakObj ? currentStreakObj.count : 0;
  const streakAtRisk = currentStreakObj ? currentStreakObj.end === lastMondayTime : false;
  let daysLeftForStreak = 0;
  if (streakAtRisk) {
    const sundayObj = new Date(currentMondayTime);
    sundayObj.setDate(sundayObj.getDate() + 6);
    sundayObj.setHours(23, 59, 59, 999);
    daysLeftForStreak = Math.ceil((sundayObj.getTime() - todayObj.getTime()) / (1000 * 3600 * 24));
  }

  const lastExpiredStreak = pastStreaks.length > 0 ? pastStreaks[pastStreaks.length - 1] : null;
  const longestStreak = allStreaks.reduce((prev, cur) => (prev.count > cur.count ? prev : cur));

  const getLabel = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    d.setDate(d.getDate() + 13);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div
      onClick={() => setShowDetails(!showDetails)}
      className={`rounded-3xl p-4 sm:p-5 shadow-lg relative overflow-hidden transition-all duration-500 border cursor-pointer active:scale-[0.98] group ${
        streakCount === 0
          ? 'bg-white/5 border-white/10 grayscale-[0.5]'
          : streakAtRisk
          ? 'bg-orange-500/10 border-orange-500/30'
          : 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 border-orange-500/30'
      }`}
    >
      <svg className={`absolute -right-6 -bottom-6 w-32 h-32 pointer-events-none ${streakCount === 0 ? 'text-white/5' : streakAtRisk ? 'text-orange-500/10' : 'text-orange-500/20'}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.586A11.962 11.962 0 0 0 7.39 9.387c-.896 1.455-1.127 3.234-.593 4.86a6.386 6.386 0 0 1-1.399-5.187C3.593 11.164 2 13.914 2 16.5c0 5.523 4.477 10 10 10s10-4.477 10-10c0-2.73-1.637-5.568-3.66-7.553a6.435 6.435 0 0 1-1.42 5.093c.531-1.63-.585-3.567-2.146-4.577C13.565 8.683 12 5.86 12 2.586z" />
      </svg>

      <div className="flex justify-between items-center relative z-10 gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center shadow-inner ${streakCount === 0 ? 'bg-white/10 text-white/40' : streakAtRisk ? 'bg-orange-500/20 text-orange-400 animate-pulse' : 'bg-gradient-to-br from-orange-400 to-rose-500 text-white'}`}>
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.586A11.962 11.962 0 0 0 7.39 9.387c-.896 1.455-1.127 3.234-.593 4.86a6.386 6.386 0 0 1-1.399-5.187C3.593 11.164 2 13.914 2 16.5c0 5.523 4.477 10 10 10s10-4.477 10-10c0-2.73-1.637-5.568-3.66-7.553a6.435 6.435 0 0 1-1.42 5.093c.531-1.63-.585-3.567-2.146-4.577C13.565 8.683 12 5.86 12 2.586z" /></svg>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-syne font-black text-3xl text-white leading-none">{streakCount}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">Semaines</span>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 block ${streakCount === 0 ? 'text-white/40' : streakAtRisk ? 'text-orange-400' : 'text-orange-200'}`}>
              {streakCount === 0 ? 'Série inactive' : streakAtRisk ? `Expire dans ${daysLeftForStreak} j.` : 'Série enflammée !'}
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0 flex items-center gap-3">
          {streakCount > 0 && streakAtRisk && (
            <span className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full animate-bounce shadow-[0_0_10px_rgba(249,115,22,0.5)] block">
              Go au ciné !
            </span>
          )}
          <svg className={`w-4 h-4 text-white/30 transition-transform duration-500 ${showDetails ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>

      <div className={`transition-all duration-500 overflow-hidden relative z-10 ${showDetails ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
        <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-white/50 mb-1">Dernière Série</p>
            {lastExpiredStreak ? (
              <>
                <div className="flex items-baseline gap-1">
                  <p className="font-syne font-black text-lg text-white leading-none">{lastExpiredStreak.count}</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/60">Semaines</p>
                </div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-white/40 mt-1">Fini le {getLabel(lastExpiredStreak.end)}</p>
              </>
            ) : (
              <p className="text-[10px] font-bold text-white/30 italic py-1">Aucune</p>
            )}
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-widest text-[var(--color-primary)]/80 mb-1">Record Absolu</p>
            <div className="flex items-baseline gap-1">
              <p className="font-syne font-black text-lg text-[var(--color-primary)] leading-none">{longestStreak.count}</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-primary)]/80">Semaines</p>
            </div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-primary)]/60 mt-1">
              {longestStreak === currentStreakObj ? 'En cours 🔥' : `Fini le ${getLabel(longestStreak.end)}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────

export function Dashboard({
  historyData,
  ratingScale,
  pricing,
  isScrolled,
  userAvatar,
  userName,
  handleScan,
  setActiveTab,
  setSelectedFilm,
}) {
  const [dashView, setDashView] = useState('all');
  const [dashValue, setDashValue] = useState('');
  const [showDetailedLang, setShowDetailedLang] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonthIndex = now.getMonth();

  const availableYears = [...new Set(historyData.map((f) => f.date?.split('/')[2]).filter(Boolean))].sort((a, b) => a - b);
  const availableMonthsRaw = [...new Set(historyData.map((f) => {
    const parts = f.date?.split('/');
    return parts?.length === 3 ? `${parts[2]}-${parts[1]}` : null;
  }).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  const options = dashView === 'year' ? availableYears : availableMonthsRaw;
  const activeMonth = dashValue || (dashView === 'month' ? availableMonthsRaw[availableMonthsRaw.length - 1] : '');
  const activeYear = dashValue || (dashView === 'year' ? availableYears[availableYears.length - 1] : '');

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

  // Métriques
  const totalFilms = dashData.length;
  const notes = dashData.map((f) => parseFloat(String(f.note).replace(',', '.'))).filter((n) => !isNaN(n) && n > 0);
  const avgNote = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;
  const durations = dashData.map((f) => parseDuration(f.duree));
  const totalMinutes = durations.reduce((a, b) => a + b, 0);
  const avgDuration = durations.length > 0 ? Math.round(totalMinutes / durations.length) : 0;

  const latestPoster = dashData.find((f) => f.affiche)?.affiche || historyData.find((f) => f.affiche)?.affiche;
  const genreCounts = {};
  dashData.forEach((f) => { if (f.genre) genreCounts[f.genre] = (genreCounts[f.genre] || 0) + 1; });
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxGenreCount = topGenres.length ? topGenres[0][1] : 1;

  // Finances
  const getPrice = (year, type) => {
    let p = pricing.default?.[type] || (type === 'sub' ? 21.90 : 13.00);
    if (pricing[year]?.[type] !== undefined) p = pricing[year][type];
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
  const isProfitable = savings >= 0;

  // Habitudes
  const seatCounts = {}, roomCounts = {};
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const timeCounts = { 'Matin': 0, 'Après-midi': 0, 'Soirée': 0, 'Nuit': 0 };
  let vfCount = 0, voCount = 0;
  const voDetails = {};

  dashData.forEach((f) => {
    const siege = String(f.siege || '').trim().toUpperCase();
    const salle = String(f.salle || '').trim();
    if (siege && siege !== '?' && siege !== 'NON RENSEIGNÉ') seatCounts[siege] = (seatCounts[siege] || 0) + 1;
    if (salle && salle !== '?' && salle !== 'NON RENSEIGNÉE') roomCounts[salle] = (roomCounts[salle] || 0) + 1;
    if (f.date) { const [d, m, y] = f.date.split('/'); const dateObj = new Date(y, m - 1, d); if (!isNaN(dateObj)) dayCounts[dateObj.getDay()]++; }
    if (f.heure) { const h = parseInt(f.heure.split(':')[0], 10); if (!isNaN(h)) { if (h < 12) timeCounts['Matin']++; else if (h < 18) timeCounts['Après-midi']++; else if (h < 22) timeCounts['Soirée']++; else timeCounts['Nuit']++; } }
    const l = (f.langue || 'VF').toUpperCase().trim();
    if (l === 'VF' || l === 'FRA' || l === 'VFQ') { vfCount++; } else { voCount++; voDetails[l] = (voDetails[l] || 0) + 1; }
  });

  const favoriteSeat = Object.entries(seatCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const topRooms = Object.entries(roomCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxRoomCount = topRooms.length > 0 ? topRooms[0][1] : 1;
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const favDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const favDay = Math.max(...dayCounts) > 0 ? dayNames[favDayIndex] : '--';
  const favTime = Math.max(...Object.values(timeCounts)) > 0 ? Object.keys(timeCounts).reduce((a, b) => (timeCounts[a] > timeCounts[b] ? a : b)) : '--';
  const totalLang = vfCount + voCount;
  const voPct = totalLang > 0 ? Math.round((voCount / totalLang) * 100) : 0;
  const vfPct = totalLang > 0 ? 100 - voPct : 0;
  const topVoDetails = Object.entries(voDetails).sort((a, b) => b[1] - a[1]);

  // Graphiques
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  let chartData = [];
  if (dashView === 'year' && activeYear) {
    const monthlyCounts = Array(12).fill(0);
    dashData.forEach((film) => { const month = parseInt(film.date?.split('/')[1], 10); if (month >= 1 && month <= 12) monthlyCounts[month - 1]++; });
    let cumulativeSum = 0;
    chartData = monthlyCounts.map((count, index) => {
      if (activeYear === currentYear && index > currentMonthIndex) return { name: monthNames[index] };
      cumulativeSum += count;
      return { name: monthNames[index], 'Films vus': count, 'Cumulé': cumulativeSum };
    });
  }

  let globalChartData = [];
  if (dashView === 'all' && availableYears.length > 0) {
    globalChartData = availableYears.map((year) => {
      const filmsOfYear = historyData.filter((f) => f.date?.endsWith(year));
      const count = filmsOfYear.length;
      const yearNotes = filmsOfYear.map((f) => parseFloat(String(f.note).replace(',', '.'))).filter((n) => !isNaN(n) && n > 0);
      const yearAvg = yearNotes.length > 0 ? yearNotes.reduce((a, b) => a + b, 0) / yearNotes.length : 0;
      return { name: year, 'Films vus': count, 'Note moy.': parseFloat(yearAvg.toFixed(2)) };
    });
  }

  let dailyBreakEvenData = [];
  if (dashView === 'month' && dashData.length > 0 && activeMonth) {
    const [y, m] = activeMonth.split('-');
    const ticketP = getPrice(y, 'ticket');
    const subP = getPrice(y, 'sub');
    const daysInMonth = new Date(y, m, 0).getDate();
    let cumulatedVal = 0;
    dailyBreakEvenData = Array.from({ length: daysInMonth }, (_, i) => {
      const dayString = String(i + 1).padStart(2, '0');
      const dateStr = `${dayString}/${m}/${y}`;
      const filmsThatDay = dashData.filter((f) => f.date === dateStr).length;
      cumulatedVal += filmsThatDay * ticketP;
      if (y === currentYear && parseInt(m, 10) - 1 === currentMonthIndex && i + 1 > now.getDate()) return { day: dayString };
      return { day: dayString, 'Valeur Billets': cumulatedVal, 'Coût Abo': subP };
    });
  }

  const formatLabel = (val, view) => {
    if (!val) return '';
    if (view === 'year') return val;
    const [yy, mm] = val.split('-');
    return `${monthNames[parseInt(mm, 10) - 1]} ${yy.slice(2)}`;
  };

  return (
    <div className="animate-in fade-in duration-500 pb-24 min-h-screen">
      {/* HEADER STICKY */}
      <div className={`sticky top-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden bg-[var(--color-bg)] w-full ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-4' : 'pt-[calc(env(safe-area-inset-top)+1rem)] pb-6'}`}>
        {latestPoster && (
          <>
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105" style={{ backgroundImage: `url(${latestPoster})` }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, var(--color-bg) 95%, var(--color-bg) 100%)' }} />
          </>
        )}

        <header className={`relative z-10 flex justify-between items-center px-6 transition-all duration-500 ${isScrolled ? 'mb-3' : 'mb-6'}`}>
          <div className="flex flex-col drop-shadow-lg">
            <span className={`font-bold uppercase tracking-widest text-[var(--color-primary)] transition-all duration-500 origin-left ${isScrolled ? 'opacity-0 h-0 overflow-hidden mb-0 text-[0px]' : 'opacity-100 h-3 text-[10px] mb-1'}`}>
              Cinéphile
            </span>
            <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 origin-left ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>
              {userName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleScan()} className={`flex items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] active:scale-90 transition-all flex-shrink-0 shadow-lg ${isScrolled ? 'w-10 h-10' : 'w-12 h-12'}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9M8 17l4 4 4-4" /></svg>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`rounded-full border-2 border-[var(--color-primary)] overflow-hidden shadow-[0_0_20px_var(--color-primary-muted)] active:scale-95 transition-all duration-500 bg-black flex-shrink-0 ${isScrolled ? 'w-10 h-10 border' : 'w-14 h-14'}`}>
              <img src={userAvatar} alt="Profil" className="w-full h-full object-contain object-bottom scale-[1.15]" />
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="relative z-10 grid grid-cols-2 gap-3 px-6">
          <div className={`bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col items-center justify-center shadow-lg transition-all duration-500 ${isScrolled ? 'h-16' : 'h-28'}`}>
            <span className={`font-syne font-black text-white leading-none tracking-tight transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-5xl'}`}>{totalFilms}</span>
            <span className={`font-bold text-white/60 transition-all duration-500 uppercase tracking-widest ${isScrolled ? 'text-[8px] mt-0.5' : 'text-[10px] mt-2'}`}>Total Films</span>
          </div>
          <div className={`bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col items-center justify-center shadow-lg transition-all duration-500 ${isScrolled ? 'h-16' : 'h-28'}`}>
            <span className={`font-syne font-black text-[var(--color-primary)] leading-none tracking-tight transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-5xl'}`}>{avgNote > 0 ? avgNote.toFixed(1).replace('.', ',') : '--'}</span>
            <span className={`font-bold text-white/60 transition-all duration-500 uppercase tracking-widest ${isScrolled ? 'text-[8px] mt-0.5' : 'text-[10px] mt-2'}`}>Note Moyenne</span>
          </div>
        </div>

        {/* Sélecteur vue + period picker */}
        <div className={`relative z-10 transition-all duration-500 overflow-hidden flex flex-col ${isScrolled ? 'max-h-0 opacity-0 mt-0' : 'max-h-40 opacity-100 mt-5'}`}>
          <div className="px-6 mb-1">
            <div className="bg-white/10 backdrop-blur-md rounded-full p-1 flex items-center justify-between">
              {[['all', 'Global'], ['year', 'Annuel'], ['month', 'Mensuel']].map(([view, label]) => (
                <button
                  key={view}
                  onClick={() => {
                    setDashView(view);
                    setDashValue(view === 'year' ? (availableYears[availableYears.length - 1] || '') : view === 'month' ? (availableMonthsRaw[availableMonthsRaw.length - 1] || '') : '');
                  }}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${dashView === view ? 'bg-white/20 text-white shadow' : 'text-white/50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {dashView !== 'all' && options.length > 0 && (
            <div className="relative w-full flex items-center justify-center py-2 animate-in fade-in duration-300">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-8 bg-white/5 rounded-full pointer-events-none border border-white/10 shadow-inner" />
              <div
                key={dashView}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide items-center w-full px-[calc(50%-3rem)] relative z-10"
                onScroll={(e) => {
                  const container = e.target;
                  const center = container.scrollLeft + container.clientWidth / 2;
                  let closest = null, minDiff = Infinity;
                  Array.from(container.children).forEach((child) => {
                    const childCenter = child.offsetLeft + child.clientWidth / 2;
                    const diff = Math.abs(childCenter - center);
                    if (diff < minDiff) { minDiff = diff; closest = child.getAttribute('data-value'); }
                  });
                  if (closest && closest !== dashValue) setDashValue(closest);
                }}
                ref={(el) => {
                  if (el && !el.dataset.initialized) {
                    const current = dashView === 'year' ? activeYear : activeMonth;
                    const activeChild = el.querySelector(`[data-value="${current}"]`);
                    if (activeChild) el.scrollLeft = activeChild.offsetLeft - el.clientWidth / 2 + activeChild.clientWidth / 2;
                    el.dataset.initialized = 'true';
                  }
                }}
              >
                {options.map((opt) => (
                  <div
                    key={opt}
                    data-value={opt}
                    onClick={(e) => {
                      const container = e.target.closest('.overflow-x-auto');
                      container.scrollTo({ left: e.currentTarget.offsetLeft - container.clientWidth / 2 + e.currentTarget.clientWidth / 2, behavior: 'smooth' });
                    }}
                    className="snap-center flex-shrink-0 w-24 flex items-center justify-center h-12 cursor-pointer"
                  >
                    <span className={`uppercase tracking-widest transition-all duration-300 ${(dashView === 'year' ? activeYear : activeMonth) === opt ? 'text-[12px] font-black text-[var(--color-primary)] drop-shadow-[0_0_8px_var(--color-primary-muted)] scale-110' : 'text-[10px] font-bold text-white/30 scale-100'}`}>
                      {formatLabel(opt, dashView)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <main className="px-6 pt-6 space-y-8">
        {/* Streak */}
        <StreakCard historyData={historyData} />

        {/* Temps passé */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Temps Passé</h2>
          </div>
          <div className="flex items-start gap-8 bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg">
            <div>
              <p className="font-syne text-3xl font-black text-white leading-none tracking-tight uppercase">
                {Math.floor(totalMinutes / 60)}H{' '}
                <span className="text-xl text-white/60">{String(totalMinutes % 60).padStart(2, '0')}M</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mt-1.5">Devant l'écran</p>
            </div>
            <div>
              <p className="font-syne text-xl font-black text-white leading-none tracking-tight uppercase mt-2">
                {Math.floor(avgDuration / 60)}H{' '}
                <span className="text-sm text-white/60">{String(avgDuration % 60).padStart(2, '0')}M</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1.5">Durée moyenne</p>
            </div>
          </div>
        </div>

        {/* Rentabilité */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Rentabilité Abonnement</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/5 rounded-3xl p-4 border border-white/5 shadow-lg flex flex-col justify-center">
              <span className="text-[9px] uppercase font-bold tracking-widest text-white/60 mb-2">Prix de Revient</span>
              <span className="font-syne font-black text-2xl text-white leading-none">{costPerFilm.toFixed(2)}€</span>
              <span className="text-[8px] uppercase tracking-widest mt-1 text-white/40">/ film vu</span>
            </div>
            <div className="bg-white/5 rounded-3xl p-4 border border-white/5 shadow-lg flex flex-col justify-center">
              <span className="text-[9px] uppercase font-bold tracking-widest text-white/60 mb-2">Le Butin</span>
              <span className={`font-syne font-black text-2xl leading-none ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {savings > 0 ? '+' : ''}{savings.toFixed(0)}€
              </span>
              <span className="text-[8px] uppercase tracking-widest mt-1 text-white/40">Économisés</span>
            </div>
          </div>

          {dashView !== 'month' && (
            <div className="bg-white/5 rounded-3xl p-5 border border-white/5 shadow-lg">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Objectif Rentabilité</span>
                <span className="text-[10px] font-black text-white">{totalStandardValue > 0 ? Math.round((totalStandardValue / totalSubCost) * 100) : 0}%</span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full bg-white/30 transition-all duration-1000" style={{ width: `${Math.min(100, totalSubCost > 0 ? (totalSubCost / Math.max(totalStandardValue, totalSubCost)) * 100 : 0)}%` }} />
                {isProfitable && (
                  <div className="h-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)] transition-all duration-1000" style={{ width: `${((totalStandardValue - totalSubCost) / totalStandardValue) * 100}%` }} />
                )}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[8px] font-bold text-white/40 uppercase">Abo: {totalSubCost.toFixed(0)}€</span>
                <span className="text-[8px] font-bold text-white/40 uppercase">Valeur: {totalStandardValue.toFixed(0)}€</span>
              </div>
            </div>
          )}
        </div>

        {/* Break-even mensuel */}
        {dashView === 'month' && dailyBreakEvenData.length > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Le Point d'Équilibre</h2>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyBreakEvenData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: 'white' }} labelStyle={{ display: 'none' }} formatter={chartTooltipFormatter} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '10px', color: 'rgba(255,255,255,0.5)' }} />
                  <Area type="stepAfter" dataKey="Valeur Billets" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} strokeWidth={2} animationDuration={1500} />
                  <Line type="monotone" dataKey="Coût Abo" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1000} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Habitudes */}
        {(favoriteSeat || topRooms.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Habitudes</h2>
            </div>
            {dashView !== 'month' && favDay !== '--' && (
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg flex items-center justify-between mb-3 relative overflow-hidden">
                <div className="flex flex-col z-10">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/60 mb-1">Moment Préféré</span>
                  <span className="font-syne font-black text-xl text-white leading-tight capitalize">Le {favDay}</span>
                  <span className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-widest">en {favTime}</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center shadow-inner z-10 border border-white/5">
                  {favTime === 'Matin' && <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>}
                  {favTime === 'Après-midi' && <svg className="w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>}
                  {(favTime === 'Soirée' || favTime === 'Nuit') && <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center gap-1.5 mb-2 relative z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-white/60">Place VIP</h3>
                </div>
                <div className="relative z-10 text-center py-2">
                  {favoriteSeat ? (
                    <>
                      <p className="font-syne text-4xl font-black text-[var(--color-primary)] drop-shadow-[0_0_15px_var(--color-primary-muted)] leading-none mb-1">{favoriteSeat[0]}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">Réservée {favoriteSeat[1]} fois</p>
                    </>
                  ) : <p className="text-xs font-bold text-white/30 italic py-2">Sans attache</p>}
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-white/60">Top Salles</h3>
                </div>
                <div className="space-y-2.5">
                  {topRooms.length > 0 ? topRooms.map(([room, count], idx) => (
                    <div key={room}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] font-bold text-white truncate pr-2"><span className="text-white/30 mr-1">#{idx + 1}</span>{room}</span>
                        <span className="text-[8px] font-black text-white/50">{count}x</span>
                      </div>
                      <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400/80 rounded-full" style={{ width: `${(count / maxRoomCount) * 100}%` }} />
                      </div>
                    </div>
                  )) : <p className="text-xs font-bold text-white/30 italic text-center py-2">Aucune donnée</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Langues */}
        {totalLang > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Préférence Linguistique</h2>
            </div>
            <div onClick={() => setShowDetailedLang(!showDetailedLang)} className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="font-syne text-2xl font-black text-[var(--color-primary)] leading-none">{voPct}%</p>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-white/50 mt-1">Version Originale</p>
                </div>
                <div className="text-right">
                  <p className="font-syne text-2xl font-black text-white leading-none">{vfPct}%</p>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-white/50 mt-1">Version Française</p>
                </div>
              </div>
              <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full bg-[var(--color-primary)] transition-all duration-1000" style={{ width: `${voPct}%` }} />
                <div className="h-full bg-white/40 transition-all duration-1000" style={{ width: `${vfPct}%` }} />
              </div>
              <div className={`transition-all duration-500 overflow-hidden ${showDetailedLang ? 'max-h-40 opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-[var(--color-primary)] mb-3">Détail VO ({voCount})</p>
                  <div className="flex flex-wrap gap-2">
                    {topVoDetails.map(([lang, count]) => (
                      <span key={lang} className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-inner">
                        <span className="text-white">{lang}</span>
                        <span className="text-[var(--color-primary)]">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <svg className={`absolute top-5 right-5 w-4 h-4 text-white/20 transition-transform duration-500 ${showDetailedLang ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        )}

        {/* Derniers billets */}
        {dashData.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Derniers Billets</h2>
            </div>
            <div className="-mx-6 px-6 flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x scroll-px-6">
              {dashData.slice(0, 8).map((film, idx) => (
                <div key={idx} onClick={() => setSelectedFilm(film)} className="snap-start flex-shrink-0 w-[5.5rem] flex flex-col gap-1.5 cursor-pointer group">
                  <div className="w-[5.5rem] h-[8rem] rounded-2xl overflow-hidden bg-white/5 shadow-lg relative transition-transform duration-300 group-active:scale-95 border border-white/10">
                    <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-1 text-center">
                    <p className="text-[10px] font-bold text-white line-clamp-1 leading-tight mb-0.5">{film.titre}</p>
                    {film.note ? (
                      <p className="text-[9px] font-black text-[var(--color-primary)] flex items-center justify-center gap-0.5">
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                        {film.note}
                      </p>
                    ) : <p className="text-[8px] font-bold text-white/30 italic">--</p>}
                  </div>
                </div>
              ))}
              <div className="flex-shrink-0 w-2 h-1" />
            </div>
          </div>
        )}

        {/* Genres */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Genres Dominants</h2>
          </div>
          <div className="space-y-4 bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg">
            {topGenres.map(([genre, count]) => (
              <div key={genre} className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-white truncate pr-2">{genre}</span>
                  <span className="text-[10px] font-black text-white/50">{count} films</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000 delay-300 shadow-[0_0_10px_var(--color-primary-muted)]" style={{ width: `${maxGenreCount > 0 ? (count / maxGenreCount) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique annuel */}
        {dashView === 'year' && chartData.length > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Activité Mensuelle {activeYear}</h2>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: 'white' }} cursor={{ stroke: 'rgba(255,255,255,0.2)' }} formatter={chartTooltipFormatter} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: 'rgba(255,255,255,0.6)' }} />
                  <Line type="monotone" dataKey="Films vus" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, strokeWidth: 3, fill: '#08090F' }} activeDot={{ r: 6 }} animationDuration={1500} />
                  <Line type="monotone" dataKey="Cumulé" stroke="var(--color-primary)" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1500} animationBegin={500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graphique global */}
        {dashView === 'all' && globalChartData.length > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Bilan Annuel</h2>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={globalChartData} margin={{ top: 10, right: -45, left: -35, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#22d3ee', fontWeight: 'bold' }} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, ratingScale]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-primary)', fontWeight: 'bold' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: 'white' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={chartTooltipFormatter} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: 'rgba(255,255,255,0.6)' }} />
                  <Bar yAxisId="left" dataKey="Films vus" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1500} />
                  <Line yAxisId="right" type="monotone" dataKey="Note moy." stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 3, fill: '#08090F' }} activeDot={{ r: 6 }} animationDuration={1500} animationBegin={500} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="h-10" />
      </main>
    </div>
  );
}