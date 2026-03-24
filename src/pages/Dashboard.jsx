import { useState } from 'react';
import {
  LineChart, Line, ComposedChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, ReferenceDot
} from 'recharts';
import { SmartPoster } from '../components/SmartPoster';
import { Avatar3D } from '../components/Avatar3D';
import { ImaxTag } from '../components/ImaxTag';

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

const formatDurationChart = (value) => {
  if (typeof value !== 'number') return value;
  const totalMins = Math.round(value);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
};

// ── Overlay : liste de films filtrée par langue ─────────────────────────────
function LangFilmsOverlay({ lang, films, onClose }) {
  const matchingFilms = films.filter((f) => {
    const l = (f.langue || 'FRA').toUpperCase().trim();
    // VF regroupe FRA, VF, VFQ
    if (lang === 'VF') return l === 'FRA' || l === 'FRA' || l === 'VFQ';
    return l === lang;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-200">
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panneau slide-up */}
      <div className="relative w-full rounded-t-[32px] bg-[#111] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300 flex flex-col"
        style={{ maxHeight: '85dvh' }}>

        {/* Handle + header fixe */}
        <div className="flex-shrink-0 px-6 pt-4 pb-3">
          <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-0.5">
                {matchingFilms.length} film{matchingFilms.length > 1 ? 's' : ''}
              </p>
              <h3 className="font-syne font-black text-2xl text-white leading-none">
                {lang === 'VF' ? 'Version Française' : `VO — ${lang}`}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 active:scale-90 transition-all border border-white/10"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Liste scrollable */}
        <div className="overflow-y-auto scrollbar-hide px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] space-y-3 pt-2">
          {matchingFilms.length === 0 ? (
            <p className="text-white/40 text-sm font-bold text-center py-10">Aucun film trouvé.</p>
          ) : (
            matchingFilms.map((film, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-0 pr-3">
                {/* Affiche */}
                <div className="w-16 h-24 flex-shrink-0 overflow-hidden shadow-inner">
                  <SmartPoster
                    afficheInitiale={film.affiche}
                    titre={film.titre}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Infos */}
                <div className="flex-1 min-w-0 py-2">
                  <p className="font-syne font-bold text-white text-sm leading-tight mb-1 truncate">{film.titre}</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">{film.date}</p>
                  
                  {/* --- NOUVEAU : Zone de tags flexible --- */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    
                    {/* Tag Note */}
                    {film.note && (
                      <span className="whitespace-nowrap flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-muted)] px-2 py-0.5 rounded-full border border-[var(--color-primary)]/20">
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        {film.note}
                      </span>
                    )}

                    {/* Tag Genre */}
                    {film.genre && (
                      <span className="whitespace-nowrap flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-white/10 bg-white/5 text-white/60">
                        {film.genre}
                      </span>
                    )}

                    {/* Tag IMAX (Appelle le composant qu'on a créé précédemment) */}
                    <div className="scale-[0.85] origin-left -ml-0.5">
                      <ImaxTag salle={film.salle} commentaire={film.commentaire} />
                    </div>

                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

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
  if (name === 'Temps Total' || name === 'Durée Moyenne') return [formatDurationChart(value), name];
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
  const [langOverlay, setLangOverlay] = useState(null); // code langue ou null
  const [showAllRooms, setShowAllRooms] = useState(false);

  // Résolution des CSS variables du thème pour recharts
  // (recharts ne supporte pas var(--...) dans les props JS)
  const colorPrimary = typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#D4AF37'
    : '#D4AF37';
  // Couleur secondaire : blanc à 50% — neutre, lisible sur tous les thèmes
  const colorSecondary = 'rgba(255,255,255,0.45)';
  // Couleur d'accentuation atténuée pour les fills
  const colorPrimaryFaded = colorPrimary + '33'; // ~20% opacité

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
  const allRooms = Object.entries(roomCounts).sort((a, b) => b[1] - a[1]); // toutes les salles
  const topRooms = allRooms.slice(0, 3);
  const maxRoomCount = allRooms.length > 0 ? allRooms[0][1] : 1;
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const favDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const favDay = Math.max(...dayCounts) > 0 ? dayNames[favDayIndex] : '--';
  const favTime = Math.max(...Object.values(timeCounts)) > 0 ? Object.keys(timeCounts).reduce((a, b) => (timeCounts[a] > timeCounts[b] ? a : b)) : '--';
  const totalLang = vfCount + voCount;
  const voPct = totalLang > 0 ? Math.round((voCount / totalLang) * 100) : 0;
  const vfPct = totalLang > 0 ? 100 - voPct : 0;
  const topVoDetails = Object.entries(voDetails).sort((a, b) => b[1] - a[1]);
  // Toutes les langues incluant VF, pour les gélules cliquables
  const allLangDetails = vfCount > 0
    ? [['FRA', vfCount], ...topVoDetails]
    : topVoDetails;

// --- Calcul du jour moyen de rentabilité (pour vues Global & Annuel) ---
  let averageBreakEvenDay = null;
  if (dashView !== 'month' && dashData.length > 0) {
    const monthGroups = {};
    // Grouper les films par mois (ex: "2023-10")
    dashData.forEach(f => {
      if (!f.date) return;
      const [d, m, y] = f.date.split('/');
      const key = `${y}-${m}`;
      if (!monthGroups[key]) monthGroups[key] = [];
      monthGroups[key].push({ ...f, day: parseInt(d, 10), price: getPrice(y, 'ticket') });
    });

    let totalBreakEvenDays = 0;
    let amortizedMonthsCount = 0;

    Object.entries(monthGroups).forEach(([key, films]) => {
      const y = key.split('-')[0];
      const subP = getPrice(y, 'sub');
      // Trier les films du mois chronologiquement
      films.sort((a, b) => a.day - b.day);
      
      let cumulated = 0;
      for (let i = 0; i < films.length; i++) {
        cumulated += films[i].price; // <-- CORRECTION : films[i] au lieu de films
        if (cumulated >= subP) {
          totalBreakEvenDays += films[i].day; // <-- CORRECTION : films[i] au lieu de films
          amortizedMonthsCount++;
          break; // On a trouvé le jour de rentabilité pour ce mois
        }
      }
    });

    if (amortizedMonthsCount > 0) {
      averageBreakEvenDay = Math.round(totalBreakEvenDays / amortizedMonthsCount);
    }
  }

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
      
      const yearDurations = filmsOfYear.map((f) => parseDuration(f.duree));
      const yearTotalMin = yearDurations.reduce((a, b) => a + b, 0);
      const yearAvgMin = yearDurations.length > 0 ? Math.round(yearTotalMin / yearDurations.length) : 0;

      // On passe les valeurs pures en minutes, le formatage "h+min" se fait au niveau de l'affichage
      return { 
        name: year, 
        'Films vus': count, 
        'Note moy.': parseFloat(yearAvg.toFixed(2)),
        'Temps Total': yearTotalMin, 
        'Durée Moyenne': yearAvgMin
      };
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
    <div className="animate-in fade-in duration-500 min-h-[100dvh]">
      {/* HEADER STICKY */}
      <div className={`sticky top-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden bg-[var(--color-bg)] w-full ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-4' : 'pt-[calc(env(safe-area-inset-top)+1rem)] pb-6'}`}>
        {latestPoster && (
          <>
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105" style={{ backgroundImage: `url(${latestPoster})` }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, var(--color-bg) 95%, var(--color-bg) 100%)' }} />
          </>
        )}

        <header className={`relative z-10 flex justify-between items-center px-6 transition-all duration-500 ${isScrolled ? 'mb-3' : 'mb-6'}`}>
          <div className="flex flex-col drop-shadow-lg justify-center">
            <span className={`font-bold uppercase tracking-widest text-[var(--color-primary)] transition-all duration-500 origin-left ${isScrolled ? 'opacity-0 h-0 overflow-hidden mb-0 text-[0px]' : 'opacity-100 h-3 text-[10px] mb-1'}`}>
              Cinéphile
            </span>
            <div className="flex items-center">
              <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 origin-left ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>
                {userName}
              </h1>
              
              {/* --- NOUVEAU : Badge Période (Visible uniquement au scroll) --- */}
              <div 
                className={`flex items-center justify-center bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)] rounded-full font-black uppercase tracking-widest transition-all duration-500 origin-left whitespace-nowrap 
                ${isScrolled ? 'opacity-100 scale-100 px-2.5 py-1 text-[9px] ml-3' : 'opacity-0 scale-50 w-0 h-0 px-0 py-0 text-[0px] ml-0 overflow-hidden'}`}
              >
                {dashView === 'all' ? 'Bilan Global' : dashView === 'year' ? activeYear : formatLabel(activeMonth, 'month')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton SYNC (Dashboard avec effet de scroll) */}
<button 
  onClick={() => handleScan()} 
  className={`group flex items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] active:scale-95 transition-all duration-300 flex-shrink-0 shadow-lg ${isScrolled ? 'w-10 h-10' : 'h-12 px-4 gap-2'}`}
>
  {/* Icône qui tourne au clic (group-active:rotate-180) */}
  <svg className="w-5 h-5 flex-shrink-0 transition-transform duration-500 group-active:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
  
  {/* Texte visible uniquement quand on est tout en haut de la page */}
  {!isScrolled && (
    <span className="font-black uppercase tracking-widest text-[10px] animate-in fade-in duration-300">
      Sync
    </span>
  )}
</button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`relative active:scale-95 transition-all duration-500 flex-shrink-0 ${isScrolled ? 'w-10 h-10' : 'w-14 h-14'}`}
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <Avatar3D
                src={userAvatar}
                size={isScrolled ? 40 : 56}
                primary="var(--color-primary)"
                glow="var(--color-primary-muted)"
                borderWidth={isScrolled ? 2 : 2.5}
              />
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
                    setShowAllRooms(false);
                    setShowDetailedLang(false);
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
          {dashView === 'all' && globalChartData.length > 0 ? (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">Évolution du Temps Passé</h2>
              </div>
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg flex flex-col">
                
                {/* Le Graphique */}
                <div className="h-60 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={globalChartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={colorSecondary} stopOpacity={0.8}/>
                          <stop offset="100%" stopColor={colorSecondary} stopOpacity={0.1}/>
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} dy={10} />
                      <YAxis yAxisId="left" hide={true} domain={[0, 'auto']} />
                      <YAxis yAxisId="right" orientation="right" hide={true} domain={['dataMin - 30', 'dataMax + 30']} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px', padding: '12px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} itemStyle={{ color: 'white', fontWeight: 'bold', padding: '3px 0' }} cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 8 }} formatter={chartTooltipFormatter} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '15px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} />
                      <Bar yAxisId="left" dataKey="Temps Total" fill="url(#colorTotal)" barSize={12} radius={[10, 10, 10, 10]} animationDuration={1500} />

                      {/* --- CORRECTION ICI --- */}
                      
                      {/* LIGNE 1 (DESSOUS) : La ligne pure avec effet GLOW, mais SANS les points */}
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="Durée Moyenne" 
                        stroke={colorPrimary} 
                        strokeWidth={4} 
                        filter="url(#glow)" /* Glow appliqué ici */
                        dot={false} /* PAS DE POINTS */
                        activeDot={false}
                        legendType="none" /* On cache de la légende pour ne pas doubler */
                        animationDuration={1500} 
                        animationBegin={500} 
                      />

                      {/* LIGNE 2 (DESSUS) : La ligne transparente, mais AVEC les points nets (sans glow) */}
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="Durée Moyenne" 
                        stroke="transparent" /* Ligne invisible */
                        strokeWidth={0}
                        dot={{ r: 5, fill: colorPrimary, stroke: colorPrimary, strokeWidth: 3 }} /* Points nets appliqué ici */
                        activeDot={{ r: 7, fill: colorPrimary, stroke: '#fff', strokeWidth: 2 }} 
                        // Mêmes timings d'animation pour qu'elles se superposent parfaitement
                        animationDuration={1500} 
                        animationBegin={500} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* --- NOUVEAU : EXTRÊMES DURÉE MOYENNE --- */}
                {(() => {
                  if (globalChartData.length < 2) return null; // Inutile s'il n'y a qu'une seule année
                  
                  // On clone le tableau pour le trier sans affecter le graphique
                  const sortedByAvg = [...globalChartData].sort((a, b) => a['Durée Moyenne'] - b['Durée Moyenne']);
                  const minAvg = sortedByAvg[0];
                  const maxAvg = sortedByAvg[sortedByAvg.length - 1];

                  // Si le min et le max sont identiques, pas besoin de l'afficher
                  if (minAvg['Durée Moyenne'] === maxAvg['Durée Moyenne']) return null;

                  return (
                    <div className="pt-4 mt-3 border-t border-white/10 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-white/50 mb-1">Moyenne la + courte</p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="font-syne font-black text-white text-lg leading-none">
                            {formatDurationChart(minAvg['Durée Moyenne'])}
                          </p>
                          <p className="text-[10px] font-bold text-white/40">en {minAvg.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-[var(--color-primary)]/80 mb-1">Moyenne la + longue</p>
                        <div className="flex items-baseline justify-end gap-1.5">
                          <p className="font-syne font-black text-[var(--color-primary)] text-lg leading-none">
                            {formatDurationChart(maxAvg['Durée Moyenne'])}
                          </p>
                          <p className="text-[10px] font-bold text-[var(--color-primary)]/50">en {maxAvg.name}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">Temps Passé</h2>
              </div>
              <div className="flex items-start gap-8 bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg">
                <div>
                  <p className="font-syne text-2xl font-black text-white leading-none tracking-tight uppercase">
                    {Math.floor(totalMinutes / 60)}H{' '}
                    <span className="text-xl text-white/60">{String(totalMinutes % 60).padStart(2, '0')}M</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mt-1.5">au total</p>
                </div>
                <div>
                  <p className="font-syne text-l font-black text-white leading-none tracking-tight uppercase mt-2">
                    {Math.floor(avgDuration / 60)}H{' '}
                    <span className="text-sm text-white/60">{String(avgDuration % 60).padStart(2, '0')}M</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1.5">en moyenne</p>
                </div>
              </div>
            </div>
          )}
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
                  <div className="h-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-1000" style={{ width: `${((totalStandardValue - totalSubCost) / totalStandardValue) * 100}%` }} />
                )}
              </div>
              <div className="flex justify-between mt-2 mb-3">
                <span className="text-[8px] font-bold text-white/40 uppercase">Abo: {totalSubCost.toFixed(0)}€</span>
                <span className="text-[8px] font-bold text-white/40 uppercase">Valeur: {totalStandardValue.toFixed(0)}€</span>
              </div>
              
              {/* --- NOUVEAU : PHRASE DE MOYENNE D'AMORTISSEMENT --- */}
              {averageBreakEvenDay && (
                <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse flex-shrink-0"></span>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 leading-tight">
                    Tu rentabilises ton abo en moyenne le <span className="text-[#10b981] font-black">{averageBreakEvenDay}</span> du mois
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Break-even mensuel */}
        {dashView === 'month' && dailyBreakEvenData.length > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Le Point d'Équilibre</h2>
            </div>
            
            {/* On ajoute "relative" ici pour pouvoir positionner la gélule par-dessus */}
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg h-56 relative overflow-hidden">
              
              {/* --- GÉLULE FLOTTANTE --- */}
              {(() => {
                // On cherche le premier jour où la valeur cumulée dépasse ou égale le coût de l'abo
                const bePoint = dailyBreakEvenData.find(d => d['Valeur Billets'] >= d['Coût Abo']);
                if (bePoint && bePoint['Valeur Billets'] > 0) {
                  return (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-[#10b981]/15 border border-[#10b981]/30 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-blur-md pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#10b981]">
                        Rentabilisé le {bePoint.day}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              <ResponsiveContainer width="100%" height="100%">
                {/* On augmente la marge "top" (de 10 à 35) pour que la gélule ne cache pas la courbe */}
                <ComposedChart data={dailyBreakEvenData} margin={{ top: 35, right: 0, left: -40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: 'white' }} labelStyle={{ display: 'none' }} formatter={chartTooltipFormatter} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '10px', color: 'rgba(255,255,255,0.5)' }} />
                  
                  <Area type="stepAfter" dataKey="Valeur Billets" stroke={colorPrimary} fill={colorPrimary} fillOpacity={0.2} strokeWidth={2} animationDuration={1500} />
                  <Line type="monotone" dataKey="Coût Abo" stroke={colorSecondary} strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1000} />

                  {/* --- POINT D'INTERSECTION --- */}
                  {(() => {
                    const bePoint = dailyBreakEvenData.find(d => d['Valeur Billets'] >= d['Coût Abo']);
                    if (bePoint && bePoint['Valeur Billets'] > 0) {
                      return (
                        <ReferenceDot 
                          x={bePoint.day} 
                          y={bePoint['Coût Abo']} 
                          r={5} 
                          fill="#10b981" 
                          stroke= 'none'
                          strokeWidth={2} 
                          isFront={true} 
                        />
                      );
                    }
                    return null;
                  })()}
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

            {/* Card Rituels — Moment préféré + Siège favori côte à côte */}
            {dashView !== 'month' && (favDay !== '--' || favoriteSeat) && (
              <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg flex items-stretch mb-3 overflow-hidden">

                {/* Moment préféré */}
                {favDay !== '--' && (
                  <div className={`flex flex-col justify-center ${favoriteSeat ? 'flex-1 border-r border-white/10 pr-4' : 'w-full'}`}>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-white/50 mb-1">Moment préféré</span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center flex-shrink-0 border border-white/5">
                        {favTime === 'Matin' && <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>}
                        {favTime === 'Après-midi' && <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}
                        {(favTime === 'Soirée' || favTime === 'Nuit') && <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
                      </div>
                      <div>
                        <p className="font-syne font-black text-base text-white leading-tight capitalize">Le {favDay}</p>
                        <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">en {favTime}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Siège favori */}
                {favoriteSeat && (
                  <div className={`flex flex-col justify-center items-center text-center ${favDay !== '--' ? 'flex-1 pl-4' : 'w-full'}`}>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-white/50 mb-1.5">Place VIP</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse flex-shrink-0" />
                      <p className="font-syne text-2xl font-black text-[var(--color-primary)] drop-shadow-[0_0_10px_var(--color-primary-muted)] leading-none">
                        {favoriteSeat[0]}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-1.5">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/35">
                        {favoriteSeat[1]}x
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-primary)]/80">
                        {totalFilms > 0 ? Math.round((favoriteSeat[1] / totalFilms) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Card Top Salles — pleine largeur, expandable */}
            <div
              className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg flex flex-col cursor-pointer active:scale-[0.98] transition-all"
              onClick={() => setShowAllRooms(!showAllRooms)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                    {showAllRooms ? `Toutes les salles (${allRooms.length})` : 'Top Salles'}
                  </h3>
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-white/20 transition-transform duration-300 ${showAllRooms ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Liste des salles */}
              <div className="space-y-2.5">
                {allRooms.length > 0 ? (showAllRooms ? allRooms : topRooms).map(([room, count], idx) => {
                  const pct = Math.round((count / maxRoomCount) * 100);
                  const sharePct = totalFilms > 0 ? Math.round((count / totalFilms) * 100) : 0;
                  return (
                    <div key={room}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] font-bold text-white truncate pr-2 flex items-center gap-1.5">
                          <span className="text-white/30 font-black">#{idx + 1}</span>
                          {room}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[8px] font-black text-[var(--color-primary)]/80">{sharePct}%</span>
                          <span className="text-[8px] font-bold text-white/35">{count} visite{count > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-primary)] opacity-80 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                }) : <p className="text-xs font-bold text-white/30 italic text-center py-2">Aucune donnée</p>}
              </div>

              {/* Hint expand */}
              {!showAllRooms && allRooms.length > 3 && (
                <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest text-center mt-3">
                  + {allRooms.length - 3} autre{allRooms.length - 3 > 1 ? 's' : ''} · tap pour tout voir
                </p>
              )}
            </div>
          </div>
        )}

        {/* Langues */}
        {totalLang > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Préférence Linguistique</h2>
            </div>
            <div
              onClick={() => setShowDetailedLang(!showDetailedLang)}
              className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="font-syne text-2xl font-black text-[var(--color-primary)] leading-none">{voPct}%</p>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-white/50 mt-1">En langue étrangère</p>
                </div>
                <div className="text-right">
                  <p className="font-syne text-2xl font-black text-white leading-none">{vfPct}%</p>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-white/50 mt-1">En français</p>
                </div>
              </div>

              {/* Barre de répartition */}
              <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden flex shadow-inner">
                <div className="h-full bg-[var(--color-primary)] transition-all duration-1000" style={{ width: `${voPct}%` }} />
                <div className="h-full bg-white/40 transition-all duration-1000" style={{ width: `${vfPct}%` }} />
              </div>

              {/* Détail expandable avec gélules cliquables */}
              <div className={`transition-all duration-500 overflow-hidden ${showDetailedLang ? 'max-h-48 opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-[var(--color-primary)] mb-3">
                    Tap une langue pour voir les films
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allLangDetails.map(([lang, count]) => (
                      <button
                        key={lang}
                        onClick={(e) => {
                          e.stopPropagation(); // ne pas refermer le détail
                          setLangOverlay(lang);
                        }}
                        className="bg-black/40 border border-white/10 hover:border-[var(--color-primary)]/40 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-inner active:scale-95 transition-all group"
                      >
                        <span className="text-white group-hover:text-[var(--color-primary)] transition-colors">{lang}</span>
                        <span className="text-[var(--color-primary)]">{count}</span>
                        <svg className="w-2.5 h-2.5 text-white/30 group-hover:text-[var(--color-primary)]/60 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <svg
                className={`absolute top-5 right-5 w-4 h-4 text-white/20 transition-transform duration-500 ${showDetailedLang ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        )}

        {/* Overlay liste films par langue */}
        {langOverlay && (
          <LangFilmsOverlay
            lang={langOverlay}
            films={dashData}
            onClose={() => setLangOverlay(null)}
          />
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
                    <div className="flex flex-col items-center gap-1.5 mb-1.5">
                      <p className="text-[10px] font-bold text-white line-clamp-1 leading-tight">{film.titre}</p>
                    </div>
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

        {/* Genres — Donut chart */}
        {topGenres.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Genres Dominants</h2>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg">
              {(() => {
                // Palette de teintes dérivées de la couleur primaire
                // On génère des variantes en jouant sur l'opacité et la luminosité
                const OPACITIES = [1, 0.75, 0.55, 0.38, 0.25, 0.15];
                const genreColors = topGenres.map((_, i) =>
                  i === 0
                    ? colorPrimary
                    : `${colorPrimary}${Math.round(OPACITIES[Math.min(i, OPACITIES.length - 1)] * 255).toString(16).padStart(2, '0')}`
                );

                const pieData = topGenres.map(([genre, count]) => ({ name: genre, value: count }));
                const topGenre = topGenres[0]?.[0] || '';
                const topCount = topGenres[0]?.[1] || 0;
                const totalGenreFilms = topGenres.reduce((acc, [, c]) => acc + c, 0);

                return (
                  <div className="flex items-center gap-4">
                    {/* Donut */}
                    <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={66}
                            paddingAngle={2}
                            dataKey="value"
                            strokeWidth={0}
                            animationBegin={0}
                            animationDuration={1200}
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={genreColors[i]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Label central */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span
                          className="font-syne font-black leading-none text-center px-2"
                          style={{
                            fontSize: topGenre.length > 8 ? '9px' : '11px',
                            color: colorPrimary,
                            textShadow: `0 0 12px ${colorPrimary}60`,
                          }}
                        >
                          {topGenre}
                        </span>
                        <span className="text-[9px] font-bold text-white/40 mt-0.5">
                          {Math.round((topCount / totalGenreFilms) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Légende */}
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      {topGenres.slice(0, 6).map(([genre, count], i) => (
                        <div key={genre} className="flex items-center gap-2 min-w-0">
                          {/* Pastille couleur */}
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: genreColors[i] }}
                          />
                          <span className="text-[10px] font-bold text-white truncate flex-1">{genre}</span>
                          <span className="text-[9px] font-black text-white/40 flex-shrink-0">{count}</span>
                        </div>
                      ))}
                      {topGenres.length > 6 && (
                        <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest">
                          + {topGenres.length - 6} autre{topGenres.length - 6 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Graphique annuel */}
        {dashView === 'year' && chartData.length > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Activité Mensuelle {activeYear}</h2>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -35, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: 'white' }} cursor={{ stroke: 'rgba(255,255,255,0.2)' }} formatter={chartTooltipFormatter} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: 'rgba(255,255,255,0.6)' }} />
                  <Line type="monotone" dataKey="Films vus" stroke={colorSecondary} strokeWidth={3} dot={{ r: 4, strokeWidth: 3, fill: 'rgba(0,0,0,0.8)', stroke: colorSecondary }} activeDot={{ r: 6 }} animationDuration={1500} />
                  <Line type="monotone" dataKey="Cumulé" stroke={colorPrimary} strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1500} animationBegin={500} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graphique global : Constellation (Qualité & Volume) */}
        {dashView === 'all' && globalChartData.length > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Bilan : Qualité & Volume</h2>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg h-80 relative overflow-hidden">
              
              {/* Légende intégrée façon infographie */}
              <div className="absolute top-4 left-5 flex flex-col gap-1.5 z-10 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full border border-[var(--color-primary)] border-dashed bg-[var(--color-primary)]/20"></span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/50">Volume de films (Taille)</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-2.5 h-2.5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-white/50">Note moyenne (Hauteur)</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={globalChartData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  
                  {/* Axe X épuré avec dy={15} pour pousser l'année plus bas et éviter le conflit */}
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} dy={15} />
                  
                  {/* CORRECTION : On crée DEUX axes Y invisibles pour que le volume n'écrase pas l'échelle des notes */}
                  <YAxis yAxisId="note" domain={['dataMin - 0.4', 'dataMax + 0.6']} hide={true} />
                  <YAxis yAxisId="volume" hide={true} />
                  
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} 
                    itemStyle={{ color: 'white', fontWeight: 'bold' }} 
                    cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2 }} 
                    formatter={chartTooltipFormatter} 
                  />

                  {/* La Ligne fantôme est branchée sur l'axe "volume" */}
                  <Line yAxisId="volume" type="monotone" dataKey="Films vus" stroke="transparent" dot={false} activeDot={false} />

                  {/* La Ligne principale est branchée sur l'axe "note" */}
                  <Line 
                    yAxisId="note"
                    type="monotone" 
                    dataKey="Note moy." 
                    stroke="rgba(255,255,255,0.15)" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    animationDuration={1500}
                    activeDot={false}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const maxFilmsGlobal = Math.max(...globalChartData.map(d => d['Films vus'] || 1));
                      
                      const r = 8 + (payload['Films vus'] / maxFilmsGlobal) * 24;
                      
                      return (
                        <g key={`custom-dot-${payload.name}`}>
                          <circle cx={cx} cy={cy} r={r} fill={colorPrimary} fillOpacity={0.15} stroke={colorPrimary} strokeWidth={1} strokeDasharray="2 2" />
                          <circle cx={cx} cy={cy} r={4} fill={colorPrimary} stroke='colorPrimary' strokeWidth={2} />
                          
                          {/* Label remonté d'un ou deux pixels */}
                          <text x={cx} y={cy - r - 8} textAnchor="middle" fill={colorPrimary} fontSize="12" fontWeight="900" style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}>
                            {payload['Note moy.']}
                          </text>
                          
                          {/* Label de volume */}
                          <text x={cx} y={cy + r + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="bold">
                            {payload['Films vus']} films
                          </text>
                        </g>
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}