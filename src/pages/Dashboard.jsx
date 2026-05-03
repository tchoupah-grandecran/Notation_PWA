import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Clock, 
  Calendar, 
  Film, 
  Star,
  Zap,
  Target,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { SmartPoster } from '../components/SmartPoster';
import { Avatar3D } from '../components/Avatar3D';

// ── HELPERS ────────────────────────────────────────────────────────────────
const parseDuration = (duree) => {
  if (!duree) return 110;
  const str = String(duree).toLowerCase().replace(/\s/g, '');
  if (str.includes('h')) {
    const parts = str.split('h');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return (hours * 60) + minutes;
  }
  const fallback = parseInt(str, 10);
  return isNaN(fallback) ? 110 : fallback;
};

const getMonthName = (monthIdx) => {
  const names = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return names[monthIdx];
};

// ── DASHBOARD COMPONENT ─────────────────────────────────────────────────────
export function Dashboard({
  historyData,
  pricing,
  userAvatar,
  userName,
  setSelectedFilm,
}) {
  const [activeYear, setActiveYear] = useState('Tout');

  // ── DATA PROCESSING ──────────────────────────────────────────────────────
  const now = new Date();
  const currentYear = now.getFullYear().toString();

  const processedData = useMemo(() => {
    const years = [...new Set(historyData.map(f => f.date?.split('/')[2]).filter(Boolean))].sort().reverse();
    
    const filtered = historyData.filter(film => {
      if (activeYear === 'Tout') return true;
      return film.date?.endsWith(activeYear);
    });

    // Stats calculations
    const totalFilms = filtered.length;
    const durations = filtered.map(f => parseDuration(f.duree));
    const totalMinutes = durations.reduce((a, b) => a + b, 0);
    const avgDuration = totalFilms > 0 ? Math.round(totalMinutes / totalFilms) : 0;
    
    const notes = filtered
      .map(f => parseFloat(String(f.note).replace(',', '.')))
      .filter(n => !isNaN(n) && n > 0);
    const avgNote = notes.length > 0 ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1) : '—';

    // Investment & Rentability
    const getPrice = (year, type) => {
      let p = pricing.default?.[type] || (type === 'sub' ? 21.90 : 13.00);
      if (pricing[year]?.[type] !== undefined) p = pricing[year][type];
      return parseFloat(p) || 0;
    };

    const totalTicketValue = filtered.reduce((acc, f) => {
      const y = f.date?.split('/')[2] || currentYear;
      return acc + getPrice(y, 'ticket');
    }, 0);

    const subscriptionInvestment = activeYear === 'Tout'
      ? years.reduce((acc, y) => acc + (12 * getPrice(y, 'sub')), 0)
      : (activeYear === currentYear ? (now.getMonth() + 1) : 12) * getPrice(activeYear, 'sub');

    const savings = (totalTicketValue - subscriptionInvestment).toFixed(2);
    const rentability = subscriptionInvestment > 0 
      ? Math.round((totalTicketValue / subscriptionInvestment) * 100) 
      : 0;

    // Monthly Chart Data
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      name: getMonthName(i),
      count: 0,
      note: 0,
      noteCount: 0
    }));

    filtered.forEach(f => {
      const [day, month, year] = (f.date || "").split('/');
      const mIdx = parseInt(month, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        monthlyData[mIdx].count += 1;
        const val = parseFloat(String(f.note).replace(',', '.'));
        if (!isNaN(val) && val > 0) {
          monthlyData[mIdx].note += val;
          monthlyData[mIdx].noteCount += 1;
        }
      }
    });

    const chartData = monthlyData.map(d => ({
      ...d,
      note: d.noteCount > 0 ? (d.note / d.noteCount).toFixed(1) : 0
    }));

    // Genre Distribution
    const genres = {};
    filtered.forEach(f => {
      if (f.genre) genres[f.genre] = (genres[f.genre] || 0) + 1;
    });
    const sortedGenres = Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      years,
      totalFilms,
      totalHours: Math.floor(totalMinutes / 60),
      totalMins: totalMinutes % 60,
      avgNote,
      avgDuration,
      savings,
      rentability,
      chartData,
      sortedGenres,
      filtered
    };
  }, [historyData, activeYear, pricing]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-outfit pb-32">
      
      {/* HEADER SECTION */}
      <header className="px-6 pt-12 pb-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-galinoy text-5xl tracking-tighter leading-none mb-2">
              {userName}
            </h1>
            <p className="text-[var(--theme-text)] opacity-40 text-[10px] font-black uppercase tracking-[0.3em]">
              Cinema Analytics Console
            </p>
          </div>
          <Avatar3D src={userAvatar} size={60} />
        </div>

        {/* YEAR PICKER */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {['Tout', ...processedData.years].map((y) => (
            <button
              key={y}
              onClick={() => setActiveYear(y)}
              className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                activeYear === y 
                ? 'bg-[var(--theme-text)] text-[var(--theme-bg)] border-[var(--theme-text)]' 
                : 'bg-transparent border-[var(--theme-text)] border-opacity-10 text-[var(--theme-text)] opacity-40'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </header>

      {/* MAIN KPIs */}
      <section className="px-6 grid grid-cols-2 gap-4 mb-8">
        <div className="flex flex-col">
          <span className="font-galinoy text-[100px] leading-[0.8] tracking-tighter">
            {processedData.totalFilms}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-2">
            Films visionnés
          </span>
        </div>
        <div className="flex flex-col justify-end items-end text-right">
          <div className="flex items-center gap-2 text-[var(--theme-primary)] mb-1">
            <Zap size={14} fill="currentColor" />
            <span className="font-galinoy text-4xl">{processedData.rentability}%</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
            Taux de rentabilité
          </span>
        </div>
      </section>

      {/* METRICS GRID */}
      <section className="px-6 grid grid-cols-3 gap-3 mb-12">
        <div className="bg-[var(--theme-text)] bg-opacity-[0.03] border border-[var(--theme-text)] border-opacity-10 p-4 rounded-2xl">
          <Clock className="opacity-20 mb-3" size={18} />
          <span className="block font-galinoy text-xl mb-1">
            {processedData.totalHours}h
          </span>
          <span className="block text-[8px] font-black uppercase opacity-30 tracking-tighter">Temps Salle</span>
        </div>
        <div className="bg-[var(--theme-text)] bg-opacity-[0.03] border border-[var(--theme-text)] border-opacity-10 p-4 rounded-2xl">
          <Star className="opacity-20 mb-3" size={18} />
          <span className="block font-galinoy text-xl mb-1">
            {processedData.avgNote}
          </span>
          <span className="block text-[8px] font-black uppercase opacity-30 tracking-tighter">Note Moyenne</span>
        </div>
        <div className="bg-[var(--theme-text)] bg-opacity-[0.03] border border-[var(--theme-text)] border-opacity-10 p-4 rounded-2xl">
          <TrendingUp className="opacity-20 mb-3" size={18} />
          <span className="block font-galinoy text-xl mb-1 text-emerald-500">
            {Math.round(processedData.savings)}€
          </span>
          <span className="block text-[8px] font-black uppercase opacity-30 tracking-tighter">Net Économisé</span>
        </div>
      </section>

      {/* ACTIVITY CHART */}
      <section className="px-6 mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Activité Mensuelle</h2>
          <span className="text-[10px] font-bold opacity-20">VOLUME / MOIS</span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData.chartData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--theme-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--theme-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-text)" opacity={0.05} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--theme-text)', opacity: 0.3, fontSize: 10}}
              />
              <Tooltip 
                contentStyle={{backgroundColor: 'var(--theme-bg)', border: '1px solid rgba(240, 234, 214, 0.1)', borderRadius: '12px'}}
                itemStyle={{color: 'var(--theme-text)'}}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="var(--theme-primary)" 
                fillOpacity={1} 
                fill="url(#colorCount)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* GENRES & PREFERENCES */}
      <section className="px-6 mb-12">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-6">Analyse des Genres</h2>
        <div className="space-y-4">
          {processedData.sortedGenres.map(([name, count], idx) => {
            const percentage = Math.round((count / processedData.totalFilms) * 100);
            return (
              <div key={name} className="relative">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold tracking-tight">{name}</span>
                  <span className="text-[10px] font-black opacity-30">{count} FILMS</span>
                </div>
                <div className="h-[4px] w-full bg-[var(--theme-text)] bg-opacity-5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--theme-text)] transition-all duration-1000" 
                    style={{ width: `${percentage}%`, opacity: 0.8 - (idx * 0.15) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RECENT ACTIVITY LIST */}
      <section className="px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Dernières Séances</h2>
          <ArrowUpRight size={14} className="opacity-20" />
        </div>
        <div className="space-y-6">
          {processedData.filtered.slice(0, 5).map((film, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedFilm(film)}
              className="flex items-center gap-5 group cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="w-14 h-20 rounded-xl overflow-hidden bg-[var(--theme-text)] bg-opacity-5 border border-[var(--theme-text)] border-opacity-10 flex-shrink-0">
                <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 border-b border-[var(--theme-text)] border-opacity-5 pb-4">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-outfit font-bold text-base truncate pr-4">{film.titre}</h4>
                  <span className="text-[10px] font-black text-[var(--theme-primary)] whitespace-nowrap">
                    {film.note}/10
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-medium opacity-40 uppercase tracking-wider">{film.date}</span>
                  <div className="w-1 h-1 rounded-full bg-[var(--theme-text)] opacity-10" />
                  <span className="text-[10px] font-medium opacity-40 uppercase tracking-wider truncate">{film.cinema || 'Pathé'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}