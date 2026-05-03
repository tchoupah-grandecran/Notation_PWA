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

// ── Chapter Divider ─────────────────────────────────────────────────────────

function ChapterDivider({ label, icon }) {
  return (
    <div className="flex items-center gap-3 px-6 py-5">
      <div className="flex-1 h-px bg-white/6" />
      <div className="flex items-center gap-2 flex-shrink-0">
        {icon && <span className="text-[var(--color-primary)] opacity-60">{icon}</span>}
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
          {label}
        </span>
      </div>
      <div className="flex-1 h-px bg-white/6" />
    </div>
  );
}

// ── Insight sentence ────────────────────────────────────────────────────────

function InsightLine({ children }) {
  return (
    <p className="text-[13px] leading-relaxed text-white/50 mt-3 px-6">
      {children}
    </p>
  );
}

// ── Overlay : liste de films filtrée par langue ─────────────────────────────

function LangFilmsOverlay({ lang, films, onClose }) {
  const matchingFilms = films.filter((f) => {
    const l = (f.langue || 'FRA').toUpperCase().trim();
    if (lang === 'VF') return l === 'FRA' || l === 'VF' || l === 'VFQ';
    return l === lang;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full rounded-t-[32px] bg-[#111] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300 flex flex-col"
        style={{ maxHeight: '85dvh' }}
      >
        <div className="flex-shrink-0 px-6 pt-4 pb-3">
          <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-0.5">
                {matchingFilms.length} film{matchingFilms.length > 1 ? 's' : ''}
              </p>
              <h3 className="font-galinoy text-2xl text-white leading-none">
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
        <div className="overflow-y-auto scrollbar-hide px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] space-y-3 pt-2">
          {matchingFilms.length === 0 ? (
            <p className="text-white/40 text-sm font-bold text-center py-10">Aucun film trouvé.</p>
          ) : (
            matchingFilms.map((film, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-0 pr-3">
                <div className="w-16 h-24 flex-shrink-0 overflow-hidden shadow-inner">
                  <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 py-2">
                  <p className="font-galinoy text-white text-lg leading-tight mb-1 truncate">{film.titre}</p>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">{film.date}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {film.note && (
                      <span className="whitespace-nowrap flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-muted)] px-2 py-0.5 rounded-full border border-[var(--color-primary)]/20">
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                        {film.note}
                      </span>
                    )}
                    {film.genre && (
                      <span className="whitespace-nowrap flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-white/10 bg-white/5 text-white/60">
                        {film.genre}
                      </span>
                    )}
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

// ── Streak logic (extracted) ────────────────────────────────────────────────

function useStreakData(historyData) {
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

  if (allStreaks.length === 0) return { streakCount: 0, streakAtRisk: false, daysLeft: 0, record: 0, pastStreaks: [] };

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

  const streakAtRisk = currentStreakObj ? currentStreakObj.end === lastMondayTime : false;
  let daysLeft = 0;
  if (streakAtRisk) {
    const sundayObj = new Date(currentMondayTime);
    sundayObj.setDate(sundayObj.getDate() + 6);
    sundayObj.setHours(23, 59, 59, 999);
    daysLeft = Math.ceil((sundayObj.getTime() - todayObj.getTime()) / (1000 * 3600 * 24));
  }

  const longestStreak = allStreaks.reduce((prev, cur) => (prev.count > cur.count ? prev : cur));

  return {
    streakCount: currentStreakObj ? currentStreakObj.count : 0,
    streakAtRisk,
    daysLeft,
    record: longestStreak.count,
    isRecord: currentStreakObj === longestStreak,
    pastStreaks,
  };
}

// ── Chapter: Présence ───────────────────────────────────────────────────────

function ChapterPresence({ totalFilms, totalMinutes, avgNote, avgDuration, dashView, activeYear, activeMonth, globalChartData, chartData, colorPrimary, colorSecondary }) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  // Compute insight sentence
  const daysEquivalent = (totalMinutes / 60 / 24).toFixed(1);
  const weeks = Math.floor(totalMinutes / 60 / 24 / 7);
  const timeInsight = totalMinutes > 0
    ? weeks > 0
      ? `soit l'équivalent de ${weeks} semaine${weeks > 1 ? 's' : ''} entière${weeks > 1 ? 's' : ''} dans l'obscurité`
      : `soit ${daysEquivalent} jour${parseFloat(daysEquivalent) > 1 ? 's' : ''} passé${parseFloat(daysEquivalent) > 1 ? 's' : ''} dans l'obscurité`
    : null;

  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  return (
    <div>
      {/* Headline numbers */}
      <div className="px-6">
        <div className="flex items-end gap-4 mb-1">
          <span className="font-galinoy text-[64px] text-white leading-none tracking-tight">{totalFilms}</span>
          <div className="pb-3">
            <div className="text-[11px] font-black uppercase tracking-widest text-white/35">films vus</div>
            <div className="text-[13px] font-medium text-white/55 mt-0.5">
              {h}h {String(m).padStart(2, '0')}min au total
            </div>
          </div>
        </div>

        {/* Sub-stats row */}
        <div className="flex gap-6 mt-1 mb-3">
          <div>
            <div className="font-galinoy text-2xl text-[var(--color-primary)] leading-none">
              {avgNote > 0 ? avgNote.toFixed(1).replace('.', ',') : '—'}
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-white/35 mt-1">Note moy.</div>
          </div>
          <div>
            <div className="font-galinoy text-2xl text-white leading-none">
              {Math.floor(avgDuration / 60)}h{String(avgDuration % 60).padStart(2, '0')}
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-white/35 mt-1">Durée moy.</div>
          </div>
        </div>

        {/* Insight sentence */}
        {timeInsight && (
          <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3.5 mt-1">
            <span className="text-[var(--color-primary)] opacity-50 mt-0.5 flex-shrink-0">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            </span>
            <p className="text-[12px] leading-relaxed text-white/45">
              {totalFilms} films, {timeInsight}.
              {avgNote > 0 && <> Ta note moyenne de <span className="text-[var(--color-primary)] font-semibold">{avgNote.toFixed(1).replace('.', ',')}/10</span> révèle un regard exigeant.</>}
            </p>
          </div>
        )}
      </div>

      {/* Chart — global: temps passé par année */}
      {dashView === 'all' && globalChartData.length > 1 && (
        <div className="mt-5 px-6">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={globalChartData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.3)" stopOpacity={1} />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.05)" stopOpacity={1} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} dy={8} />
                <YAxis yAxisId="left" hide domain={[0, 'auto']} />
                <YAxis yAxisId="right" orientation="right" hide domain={['dataMin - 30', 'dataMax + 30']} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', fontSize: '12px', padding: '10px 14px' }}
                  itemStyle={{ color: 'white', fontWeight: 'bold', padding: '2px 0' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  formatter={chartTooltipFormatter}
                />
                <Bar yAxisId="left" dataKey="Temps Total" fill="url(#colorTotal)" barSize={14} radius={[8, 8, 4, 4]} animationDuration={1500} />
                <Line yAxisId="right" type="monotone" dataKey="Durée Moyenne" stroke={colorPrimary} strokeWidth={3} filter="url(#glow)" dot={false} activeDot={false} legendType="none" animationDuration={1500} animationBegin={400} />
                <Line yAxisId="right" type="monotone" dataKey="Durée Moyenne" stroke="transparent" strokeWidth={0} dot={{ r: 5, fill: colorPrimary, stroke: colorPrimary, strokeWidth: 2 }} activeDot={{ r: 7, fill: colorPrimary, stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} animationBegin={400} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Chart legend */}
          <div className="flex items-center justify-center gap-5 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-white/25" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Temps total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded-full" style={{ background: colorPrimary }} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Durée moyenne</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart — annual: monthly activity */}
      {dashView === 'year' && chartData.length > 0 && (
        <div className="mt-5 px-6">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 8, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', fontSize: '11px' }}
                  itemStyle={{ color: 'white' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                  formatter={chartTooltipFormatter}
                />
                <Line type="monotone" dataKey="Films vus" stroke={colorSecondary} strokeWidth={3} dot={{ r: 4, strokeWidth: 3, fill: 'rgba(0,0,0,0.8)', stroke: colorSecondary }} activeDot={{ r: 6 }} animationDuration={1500} />
                <Line type="monotone" dataKey="Cumulé" stroke={colorPrimary} strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1500} animationBegin={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-5 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded-full bg-white/40" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Films / mois</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-px border-t border-dashed" style={{ borderColor: colorPrimary }} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Cumulé</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chapter: Investissement ─────────────────────────────────────────────────

function ChapterInvestissement({ totalFilms, totalStandardValue, totalSubCost, savings, costPerFilm, averageBreakEvenDay, dashView, dailyBreakEvenData, colorPrimary, colorSecondary }) {
  const isProfitable = savings >= 0;

  return (
    <div>
      {/* Three mini-cells */}
      <div className="px-6 grid grid-cols-3 gap-2.5 mb-4">
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-3.5 flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-2">Butin</span>
          <span className={`font-galinoy text-2xl leading-none ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            {savings > 0 ? '+' : ''}{savings.toFixed(0)}€
          </span>
          <span className="text-[8px] text-white/30 mt-1.5 uppercase tracking-wide">économisés</span>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-3.5 flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-2">Prix</span>
          <span className="font-galinoy text-2xl text-white leading-none">{costPerFilm.toFixed(2)}€</span>
          <span className="text-[8px] text-white/30 mt-1.5 uppercase tracking-wide">/ film</span>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-3.5 flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-2">Valeur</span>
          <span className="font-galinoy text-2xl text-[var(--color-primary)] leading-none">
            {totalStandardValue > 0 ? Math.round((totalStandardValue / totalSubCost) * 100) : 0}%
          </span>
          <span className="text-[8px] text-white/30 mt-1.5 uppercase tracking-wide">rentabilité</span>
        </div>
      </div>

      {/* Insight sentence */}
      {averageBreakEvenDay && dashView !== 'month' && (
        <div className="mx-6 flex items-center gap-2.5 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-2xl p-3.5 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
          <p className="text-[12px] leading-relaxed text-white/45">
            Tu rentabilises ton abo en moyenne le{' '}
            <span className="text-emerald-400 font-semibold">{averageBreakEvenDay} du mois</span>.
            {isProfitable && savings > 0 && (
              <> Le reste, c'est du pur bénéfice — <span className="text-emerald-400 font-semibold">{savings.toFixed(0)}€ cumulés</span> depuis le début.</>
            )}
          </p>
        </div>
      )}

      {/* Progress bar — global / year view */}
      {dashView !== 'month' && (
        <div className="px-6">
          <div className="flex justify-between mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Objectif rentabilité</span>
            <span className="text-[9px] font-black text-white/50">
              {totalSubCost.toFixed(0)}€ abo · {totalStandardValue.toFixed(0)}€ valeur
            </span>
          </div>
          <div className="h-2 w-full bg-white/[0.07] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-white/25 transition-all duration-1000"
              style={{ width: `${Math.min(100, totalSubCost > 0 ? (totalSubCost / Math.max(totalStandardValue, totalSubCost)) * 100 : 0)}%` }}
            />
            {isProfitable && (
              <div
                className="h-full bg-emerald-400 transition-all duration-1000"
                style={{ width: `${((totalStandardValue - totalSubCost) / totalStandardValue) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Break-even mensuel chart */}
      {dashView === 'month' && dailyBreakEvenData.length > 0 && (
        <div className="px-6">
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-4 h-52 relative overflow-hidden">
            {(() => {
              const bePoint = dailyBreakEvenData.find(d => d['Valeur Billets'] >= d['Coût Abo']);
              if (bePoint && bePoint['Valeur Billets'] > 0) {
                return (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-full pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      Rentabilisé le {bePoint.day}
                    </span>
                  </div>
                );
              }
              return null;
            })()}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyBreakEvenData} margin={{ top: 30, right: 0, left: -40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)', fontWeight: 'bold' }} interval="preserveStartEnd" minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)', fontWeight: 'bold' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                  itemStyle={{ color: 'white' }}
                  labelStyle={{ display: 'none' }}
                  formatter={chartTooltipFormatter}
                />
                <Area type="stepAfter" dataKey="Valeur Billets" stroke={colorPrimary} fill={colorPrimary} fillOpacity={0.15} strokeWidth={2} animationDuration={1500} />
                <Line type="monotone" dataKey="Coût Abo" stroke={colorSecondary} strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1000} />
                {(() => {
                  const bePoint = dailyBreakEvenData.find(d => d['Valeur Billets'] >= d['Coût Abo']);
                  if (bePoint && bePoint['Valeur Billets'] > 0) {
                    return <ReferenceDot x={bePoint.day} y={bePoint['Coût Abo']} r={5} fill="#10b981" stroke="none" isFront />;
                  }
                  return null;
                })()}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chapter: Constance (streak) ─────────────────────────────────────────────

function ChapterConstance({ historyData }) {
  const { streakCount, streakAtRisk, daysLeft, record, isRecord } = useStreakData(historyData);

  if (record === 0) return null;

  return (
    <div className="px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Flame */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            streakCount === 0 ? 'bg-white/5' :
            streakAtRisk ? 'bg-orange-500/15 animate-pulse' :
            'bg-orange-500/15'
          }`}>
            <svg className={`w-6 h-6 fill-current ${streakCount === 0 ? 'text-white/20' : streakAtRisk ? 'text-orange-400' : 'text-orange-400'}`} viewBox="0 0 24 24">
              <path d="M12 2.586A11.962 11.962 0 0 0 7.39 9.387c-.896 1.455-1.127 3.234-.593 4.86a6.386 6.386 0 0 1-1.399-5.187C3.593 11.164 2 13.914 2 16.5c0 5.523 4.477 10 10 10s10-4.477 10-10c0-2.73-1.637-5.568-3.66-7.553a6.435 6.435 0 0 1-1.42 5.093c.531-1.63-.585-3.567-2.146-4.577C13.565 8.683 12 5.86 12 2.586z" />
            </svg>
          </div>
          {/* Numbers */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`font-galinoy text-5xl leading-none ${streakCount === 0 ? 'text-white/20' : streakAtRisk ? 'text-orange-400' : 'text-orange-400'}`}>
                {streakCount}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/35">sem. d'affilée</span>
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
              streakCount === 0 ? 'text-white/25' :
              streakAtRisk ? 'text-orange-400' :
              'text-orange-300/70'
            }`}>
              {streakCount === 0 ? 'Série inactive' : streakAtRisk ? `⚡ Expire dans ${daysLeft} j.` : 'Série active'}
            </div>
          </div>
        </div>

        {/* Record */}
        <div className="text-right">
          <div className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1">Record</div>
          <div className={`font-galinoy text-2xl leading-none ${isRecord ? 'text-[var(--color-primary)]' : 'text-white/40'}`}>
            {record}
          </div>
          {isRecord && (
            <div className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] mt-1">En cours 🔥</div>
          )}
        </div>
      </div>

      {/* At-risk CTA */}
      {streakAtRisk && streakCount > 0 && (
        <div className="mt-4 flex items-center justify-between bg-orange-500/10 border border-orange-500/25 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-orange-300/80 leading-tight">
            Ta série de <span className="font-semibold text-orange-300">{streakCount} semaines</span> s'éteint si tu ne vas pas au cinéma cette semaine.
          </p>
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/20 px-3 py-1.5 rounded-full flex-shrink-0 ml-3 animate-bounce">
            Y aller !
          </span>
        </div>
      )}
    </div>
  );
}

// ── Chapter: Rituels ────────────────────────────────────────────────────────

function ChapterRituels({ favDay, favTime, favoriteSeat, totalFilms, allRooms, vfPct, voPct, topVoDetails, totalLang, dashData, showAllRooms, setShowAllRooms, showDetailedLang, setShowDetailedLang, setLangOverlay }) {
  const allLangDetails = (vfPct > 0 && totalLang > 0)
    ? [['FRA', Math.round((vfPct / 100) * totalLang)], ...topVoDetails]
    : topVoDetails;

  const maxRoomCount = allRooms.length > 0 ? allRooms[0][1] : 1;
  const topRooms = allRooms.slice(0, 3);

  return (
    <div className="px-6 space-y-3">

      {/* Moment + Place row */}
      {(favDay !== '--' || favoriteSeat) && (
        <div className="flex gap-2.5">
          {favDay !== '--' && (
            <div className={`bg-white/[0.04] border border-white/[0.07] rounded-2xl p-3.5 flex flex-col justify-center ${favoriteSeat ? 'flex-1' : 'w-full'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-2">Moment préféré</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-black/30 border border-white/8 flex items-center justify-center flex-shrink-0">
                  {favTime === 'Matin' && <svg className="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>}
                  {favTime === 'Après-midi' && <svg className="w-3.5 h-3.5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}
                  {(favTime === 'Soirée' || favTime === 'Nuit') && <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white capitalize leading-tight">Le {favDay}</p>
                  <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">en {favTime}</p>
                </div>
              </div>
            </div>
          )}
          {favoriteSeat && (
            <div className={`bg-white/[0.04] border border-white/[0.07] rounded-2xl p-3.5 flex flex-col items-center justify-center ${favDay !== '--' ? 'flex-1' : 'w-full'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-2">Place fétiche</span>
              <span className="font-galinoy text-3xl text-[var(--color-primary)] leading-none">
                {favoriteSeat[0]}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1.5">
                {totalFilms > 0 ? Math.round((favoriteSeat[1] / totalFilms) * 100) : 0}% des séances
              </span>
            </div>
          )}
        </div>
      )}

      {/* Language bar */}
      {totalLang > 0 && (
        <div
          className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-3.5 cursor-pointer active:scale-[0.99] transition-all"
          onClick={() => setShowDetailedLang(!showDetailedLang)}
        >
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Langue</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-galinoy text-xl text-[var(--color-primary)] leading-none">{voPct}%</span>
                <span className="text-[10px] text-white/40">VO</span>
                <span className="text-white/20 mx-1">·</span>
                <span className="font-galinoy text-xl text-white/60 leading-none">{vfPct}%</span>
                <span className="text-[10px] text-white/40">VF</span>
              </div>
            </div>
            <svg className={`w-4 h-4 text-white/20 transition-transform duration-300 ${showDetailedLang ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
          <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden flex">
            <div className="h-full rounded-l-full transition-all duration-1000" style={{ width: `${voPct}%`, background: 'var(--color-primary)' }} />
            <div className="h-full bg-white/30 rounded-r-full transition-all duration-1000" style={{ width: `${vfPct}%` }} />
          </div>

          {/* Expanded language detail */}
          <div className={`transition-all duration-500 overflow-hidden ${showDetailedLang ? 'max-h-36 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}`}>
            <div className="pt-3 border-t border-white/6 flex flex-wrap gap-2">
              <p className="w-full text-[9px] uppercase font-bold tracking-widest text-[var(--color-primary)] mb-1">
                Tap une langue pour voir les films
              </p>
              {allLangDetails.map(([lang, count]) => (
                <button
                  key={lang}
                  onClick={(e) => { e.stopPropagation(); setLangOverlay(lang); }}
                  className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <span className="text-white">{lang}</span>
                  <span className="text-[var(--color-primary)]">{count}</span>
                  <svg className="w-2.5 h-2.5 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top salles */}
      {allRooms.length > 0 && (
        <div
          className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-3.5 cursor-pointer active:scale-[0.99] transition-all"
          onClick={() => setShowAllRooms(!showAllRooms)}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
              {showAllRooms ? `Toutes les salles (${allRooms.length})` : 'Top salles'}
            </span>
            <svg className={`w-3.5 h-3.5 text-white/20 transition-transform duration-300 ${showAllRooms ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
          <div className="space-y-2.5">
            {(showAllRooms ? allRooms : topRooms).map(([room, count], idx) => {
              const pct = Math.round((count / maxRoomCount) * 100);
              const sharePct = totalFilms > 0 ? Math.round((count / totalFilms) * 100) : 0;
              return (
                <div key={room}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-bold text-white truncate pr-2 flex items-center gap-1.5">
                      <span className="text-white/25 font-black">#{idx + 1}</span>
                      {room}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[8px] font-black text-[var(--color-primary)]/70">{sharePct}%</span>
                      <span className="text-[8px] font-bold text-white/30">{count} visite{count > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'var(--color-primary)', opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
          </div>
          {!showAllRooms && allRooms.length > 3 && (
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest text-center mt-3">
              + {allRooms.length - 3} autre{allRooms.length - 3 > 1 ? 's' : ''} · tap pour tout voir
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Chapter: Genres ─────────────────────────────────────────────────────────

function ChapterGenres({ topGenres, colorPrimary }) {
  if (!topGenres.length) return null;

  const OPACITIES = [1, 0.72, 0.5, 0.34, 0.22, 0.14];
  const genreColors = topGenres.map((_, i) =>
    i === 0 ? colorPrimary : `${colorPrimary}${Math.round(OPACITIES[Math.min(i, OPACITIES.length - 1)] * 255).toString(16).padStart(2, '0')}`
  );
  const pieData = topGenres.map(([genre, count]) => ({ name: genre, value: count }));
  const topGenre = topGenres[0]?.[0] || '';
  const topCount = topGenres[0]?.[1] || 0;
  const totalGenreFilms = topGenres.reduce((acc, [, c]) => acc + c, 0);

  // Insight
  const topPct = Math.round((topCount / totalGenreFilms) * 100);

  return (
    <div className="px-6">
      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
          <ResponsiveContainer width={130} height={130}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={2} dataKey="value" strokeWidth={0} animationBegin={0} animationDuration={1200}>
                {pieData.map((_, i) => <Cell key={i} fill={genreColors[i]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-galinoy leading-none text-center px-2" style={{ fontSize: topGenre.length > 8 ? '10px' : '12px', color: colorPrimary }}>
              {topGenre}
            </span>
            <span className="text-[9px] font-bold text-white/35 mt-0.5">{topPct}%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {topGenres.slice(0, 6).map(([genre, count], i) => (
            <div key={genre} className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: genreColors[i] }} />
              <span className="text-[10px] font-bold text-white truncate flex-1">{genre}</span>
              <span className="text-[9px] font-black text-white/35 flex-shrink-0">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insight sentence */}
      <div className="mt-4 flex items-start gap-2.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3.5">
        <p className="text-[12px] leading-relaxed text-white/45">
          <span className="text-[var(--color-primary)] font-semibold">{topGenre}</span> domine ta cinéphilie à {topPct}%.
          {topGenres.length > 1 && (
            <> Suivi de près par <span className="text-white/70">{topGenres[1][0]}</span>{topGenres.length > 2 ? ` et ${topGenres[2][0]}` : ''}.</>
          )}
        </p>
      </div>
    </div>
  );
}

// ── Chapter: Derniers Billets ───────────────────────────────────────────────

function ChapterBillets({ dashData, setSelectedFilm }) {
  if (!dashData.length) return null;

  return (
    <div className="-mx-6 px-6 flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x scroll-px-6">
      {dashData.slice(0, 10).map((film, idx) => (
        <div
          key={idx}
          onClick={() => setSelectedFilm(film)}
          className="snap-start flex-shrink-0 w-[5.5rem] flex flex-col gap-1.5 cursor-pointer group"
        >
          <div className="w-[5.5rem] h-[8rem] rounded-2xl overflow-hidden bg-white/5 shadow-lg relative transition-all duration-300 group-active:scale-95 border border-white/[0.08]">
            <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
          </div>
          <div className="px-0.5">
            <p className="text-[10px] font-bold text-white/70 line-clamp-2 leading-tight mb-1">{film.titre}</p>
            {film.note ? (
              <p className="text-[9px] font-black text-[var(--color-primary)] flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                {film.note}
              </p>
            ) : (
              <p className="text-[8px] font-bold text-white/25 italic">—</p>
            )}
          </div>
        </div>
      ))}
      <div className="flex-shrink-0 w-2" />
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

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
  currentThemeKey,
}) {
  const [dashView, setDashView] = useState('all');
  const [dashValue, setDashValue] = useState('');
  const [showDetailedLang, setShowDetailedLang] = useState(false);
  const [langOverlay, setLangOverlay] = useState(null);
  const [showAllRooms, setShowAllRooms] = useState(false);

  const colorPrimary = typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#D4AF37'
    : '#D4AF37';
  const colorSecondary = 'rgba(255,255,255,0.4)';

  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonthIndex = now.getMonth();

  const availableYears = [...new Set(historyData.map((f) => f.date?.split('/')[2]).filter(Boolean))].sort();
  const availableMonthsRaw = [...new Set(historyData.map((f) => {
    const parts = f.date?.split('/');
    return parts?.length === 3 ? `${parts[2]}-${parts[1]}` : null;
  }).filter(Boolean))].sort();

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

  // ── Computed metrics ──

  const totalFilms = dashData.length;
  const notes = dashData.map((f) => parseFloat(String(f.note).replace(',', '.'))).filter((n) => !isNaN(n) && n > 0);
  const avgNote = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;
  const durations = dashData.map((f) => parseDuration(f.duree));
  const totalMinutes = durations.reduce((a, b) => a + b, 0);
  const avgDuration = durations.length > 0 ? Math.round(totalMinutes / durations.length) : 0;

  const latestPoster = dashData.find((f) => f.affiche)?.affiche || historyData.find((f) => f.affiche)?.affiche;

  // Genres
  const genreCounts = {};
  dashData.forEach((f) => { if (f.genre) genreCounts[f.genre] = (genreCounts[f.genre] || 0) + 1; });
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

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

  // Break-even avg day
  let averageBreakEvenDay = null;
  if (dashView !== 'month' && dashData.length > 0) {
    const monthGroups = {};
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
      films.sort((a, b) => a.day - b.day);
      let cumulated = 0;
      for (let i = 0; i < films.length; i++) {
        cumulated += films[i].price;
        if (cumulated >= subP) { totalBreakEvenDays += films[i].day; amortizedMonthsCount++; break; }
      }
    });
    if (amortizedMonthsCount > 0) averageBreakEvenDay = Math.round(totalBreakEvenDays / amortizedMonthsCount);
  }

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
  const allRooms = Object.entries(roomCounts).sort((a, b) => b[1] - a[1]);
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const favDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const favDay = Math.max(...dayCounts) > 0 ? dayNames[favDayIndex] : '--';
  const favTime = Math.max(...Object.values(timeCounts)) > 0
    ? Object.keys(timeCounts).reduce((a, b) => (timeCounts[a] > timeCounts[b] ? a : b))
    : '--';
  const totalLang = vfCount + voCount;
  const voPct = totalLang > 0 ? Math.round((voCount / totalLang) * 100) : 0;
  const vfPct = totalLang > 0 ? 100 - voPct : 0;
  const topVoDetails = Object.entries(voDetails).sort((a, b) => b[1] - a[1]);

  // Charts data
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
      return { name: year, 'Films vus': count, 'Note moy.': parseFloat(yearAvg.toFixed(2)), 'Temps Total': yearTotalMin, 'Durée Moyenne': yearAvgMin };
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

  const hasHabits = favDay !== '--' || favoriteSeat || allRooms.length > 0 || totalLang > 0;

  // ── Render ──

  return (
    <div className="animate-in fade-in duration-500 min-h-[100dvh]">

      {/* ── STICKY HEADER ── */}
      <div className={`sticky top-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden bg-[var(--color-bg)] w-full ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3' : 'pt-[calc(env(safe-area-inset-top)+1rem)] pb-5'}`}>

        {/* Poster blur bg */}
        {latestPoster && (
          <>
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105" style={{ backgroundImage: `url(${latestPoster})` }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, var(--color-bg) 95%, var(--color-bg) 100%)' }} />
          </>
        )}

        {/* Name + avatar */}
        <header className={`relative z-10 flex justify-between items-center px-6 transition-all duration-500 ${isScrolled ? 'mb-3' : 'mb-5'}`}>
          <div className="flex flex-col drop-shadow-lg justify-center">
            <span className={`font-bold uppercase tracking-widest text-[var(--color-primary)] transition-all duration-500 origin-left ${isScrolled ? 'opacity-0 h-0 overflow-hidden mb-0 text-[0px]' : 'opacity-100 h-3 text-[10px] mb-1'}`}>
              Cinéphile
            </span>
            <div className="flex items-center gap-3">
              <h1 className={`font-galinoy text-white leading-none transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-5xl'}`}>
                {userName}
              </h1>
              {/* Scrolled period badge */}
              <div className={`flex items-center justify-center bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[var(--color-primary)] rounded-full font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${isScrolled ? 'opacity-100 scale-100 px-2.5 py-1 text-[9px]' : 'opacity-0 scale-50 w-0 h-0 px-0 py-0 text-[0px] overflow-hidden'}`}>
                {dashView === 'all' ? 'Bilan Global' : dashView === 'year' ? activeYear : formatLabel(activeMonth, 'month')}
              </div>
            </div>
          </div>
          <button onClick={() => setActiveTab('profile')} className={`relative active:scale-95 transition-all duration-500 flex-shrink-0 ${isScrolled ? 'w-10 h-10' : 'w-14 h-14'}`} style={{ background: 'none', border: 'none', padding: 0 }}>
            <Avatar3D src={userAvatar} size={isScrolled ? 40 : 56} primary="var(--color-primary)" glow="var(--color-primary-muted)" borderWidth={isScrolled ? 2 : 2.5} />
          </button>
        </header>

        {/* Period picker — hidden on scroll */}
        <div className={`relative z-10 transition-all duration-500 overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-40 opacity-100'}`}>
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
                    <span className={`uppercase tracking-widest transition-all duration-300 ${(dashView === 'year' ? activeYear : activeMonth) === opt ? 'text-[12px] font-black text-[var(--color-primary)] drop-shadow-[0_0_8px_var(--color-primary-muted)] scale-110' : 'text-[10px] font-bold text-white/30'}`}>
                      {formatLabel(opt, dashView)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CHAPTERS ── */}
      <main className="pb-16">

        {/* ── Chapitre : Présence ── */}
        <div className="pt-6">
          <ChapterPresence
            totalFilms={totalFilms}
            totalMinutes={totalMinutes}
            avgNote={avgNote}
            avgDuration={avgDuration}
            dashView={dashView}
            activeYear={activeYear}
            activeMonth={activeMonth}
            globalChartData={globalChartData}
            chartData={chartData}
            colorPrimary={colorPrimary}
            colorSecondary={colorSecondary}
          />
        </div>

        {/* ── Chapitre : Investissement ── */}
        {totalFilms > 0 && (
          <>
            <ChapterDivider label="Investissement" />
            <ChapterInvestissement
              totalFilms={totalFilms}
              totalStandardValue={totalStandardValue}
              totalSubCost={totalSubCost}
              savings={savings}
              costPerFilm={costPerFilm}
              averageBreakEvenDay={averageBreakEvenDay}
              dashView={dashView}
              dailyBreakEvenData={dailyBreakEvenData}
              colorPrimary={colorPrimary}
              colorSecondary={colorSecondary}
            />
          </>
        )}

        {/* ── Chapitre : Constance ── */}
        <ChapterDivider label="Constance" />
        <ChapterConstance historyData={historyData} />

        {/* ── Chapitre : Genres ── */}
        {topGenres.length > 0 && (
          <>
            <ChapterDivider label="Genres dominants" />
            <ChapterGenres topGenres={topGenres} colorPrimary={colorPrimary} />
          </>
        )}

        {/* ── Chapitre : Rituels ── */}
        {hasHabits && (
          <>
            <ChapterDivider label="Rituels" />
            <ChapterRituels
              favDay={favDay}
              favTime={favTime}
              favoriteSeat={favoriteSeat}
              totalFilms={totalFilms}
              allRooms={allRooms}
              vfPct={vfPct}
              voPct={voPct}
              topVoDetails={topVoDetails}
              totalLang={totalLang}
              dashData={dashData}
              showAllRooms={showAllRooms}
              setShowAllRooms={setShowAllRooms}
              showDetailedLang={showDetailedLang}
              setShowDetailedLang={setShowDetailedLang}
              setLangOverlay={setLangOverlay}
            />
          </>
        )}

        {/* ── Chapitre : Derniers Billets ── */}
        {dashData.length > 0 && (
          <>
            <ChapterDivider label="Derniers billets" />
            <div className="px-6">
              <ChapterBillets dashData={dashData} setSelectedFilm={setSelectedFilm} />
            </div>
          </>
        )}

        {/* ── Bilan Qualité & Volume (global only) ── */}
        {dashView === 'all' && globalChartData.length > 0 && (
          <>
            <ChapterDivider label="Qualité & Volume" />
            <div className="px-6">
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl overflow-hidden" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={globalChartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} dy={12} />
                    <YAxis yAxisId="note" domain={['dataMin - 0.4', 'dataMax + 0.6']} hide />
                    <YAxis yAxisId="volume" hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                      itemStyle={{ color: 'white', fontWeight: 'bold' }}
                      cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2 }}
                      formatter={chartTooltipFormatter}
                    />
                    <Line yAxisId="volume" type="monotone" dataKey="Films vus" stroke="transparent" dot={false} activeDot={false} />
                    <Line
                      yAxisId="note"
                      type="monotone"
                      dataKey="Note moy."
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      animationDuration={1500}
                      activeDot={false}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        const maxFilmsGlobal = Math.max(...globalChartData.map(d => d['Films vus'] || 1));
                        const r = 8 + (payload['Films vus'] / maxFilmsGlobal) * 24;
                        return (
                          <g key={`dot-${payload.name}`}>
                            <circle cx={cx} cy={cy} r={r} fill={colorPrimary} fillOpacity={0.12} stroke={colorPrimary} strokeWidth={1} strokeDasharray="2 2" />
                            <circle cx={cx} cy={cy} r={4} fill={colorPrimary} strokeWidth={2} />
                            <text x={cx} y={cy - r - 8} textAnchor="middle" fill={colorPrimary} fontSize="11" fontWeight="900">{payload['Note moy.']}</text>
                            <text x={cx} y={cy + r + 13} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontWeight="bold">{payload['Films vus']} films</text>
                          </g>
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center justify-center gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border opacity-60" style={{ borderColor: colorPrimary, borderStyle: 'dashed' }} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Volume (taille)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: colorPrimary }} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Note moyenne (hauteur)</span>
                </div>
              </div>
            </div>
          </>
        )}

      </main>

      {/* ── Langue overlay ── */}
      {langOverlay && (
        <LangFilmsOverlay lang={langOverlay} films={dashData} onClose={() => setLangOverlay(null)} />
      )}
    </div>
  );
}