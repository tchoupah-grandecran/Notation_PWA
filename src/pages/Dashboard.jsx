import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Clock,
  Star,
  TrendingUp,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { SmartPoster } from '../components/SmartPoster';
import { Avatar3D }    from '../components/Avatar3D';
import { AppHeader }   from '../components/AppHeader';

// ── HELPERS (unchanged from original) ────────────────────────────────────────

const parseDuration = (duree) => {
  if (!duree) return 110;
  const str = String(duree).toLowerCase().replace(/\s/g, '');
  if (str.includes('h')) {
    const parts = str.split('h');
    const hours   = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }
  const fallback = parseInt(str, 10);
  return isNaN(fallback) ? 110 : fallback;
};

const getMonthName = (monthIdx) => {
  const names = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
  return names[monthIdx];
};

// ── ANIMATED COUNTER HOOK ─────────────────────────────────────────────────────
// Counts from 0 to `target` over `duration` ms using rAF.
// Returns the current display value (number).

function useCountUp(target, duration = 900, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef  = useRef(null);
  const prevRef = useRef(target);

  useEffect(() => {
    // Skip animation if target hasn't meaningfully changed
    if (prevRef.current === target && value !== 0) return;
    prevRef.current = target;

    const start     = performance.now();
    const startVal  = 0;

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = startVal + (target - startVal) * eased;

      setValue(parseFloat(current.toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, decimals]);

  return value;
}

// ── COLLAPSIBLE SECTION ───────────────────────────────────────────────────────

function CollapsibleSection({ label, badge, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-[var(--theme-border)]">
      {/* Header row — full-width tap target */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 px-1 min-h-[3rem] active:opacity-60 transition-opacity"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--theme-text)] opacity-40">
            {label}
          </span>
          {badge !== undefined && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[var(--theme-accent)] text-[var(--theme-bg)] opacity-80">
              {badge}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronDown size={16} className="text-[var(--theme-text)] opacity-30" />
        </motion.div>
      </button>

      {/* Animated content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: 'hidden' }}
          >
            {/* Thin separator between header and content */}
            <div className="h-px bg-[var(--theme-border)] opacity-40 mb-4" />
            <div className="pb-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── CUSTOM TOOLTIP FOR CHART ──────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-2xl px-4 py-3 shadow-xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text)] opacity-40 mb-1">
        {label}
      </p>
      <p className="font-galinoy text-2xl text-[var(--theme-text)]">
        {payload[0].value}
        <span className="text-sm opacity-40 ml-1 font-outfit">films</span>
      </p>
    </div>
  );
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export function Dashboard({
  historyData,
  pricing,
  userAvatar,
  userName,
  setSelectedFilm,
  scrollY = 0,
}) {
  const [activeYear, setActiveYear] = useState('Tout');

  // ── DATA (all logic unchanged from original) ──────────────────────────────
  const now         = new Date();
  const currentYear = now.getFullYear().toString();

  const processedData = useMemo(() => {
    const years = [
      ...new Set(historyData.map(f => f.date?.split('/')[2]).filter(Boolean))
    ].sort().reverse();

    const filtered = historyData.filter(film => {
      if (activeYear === 'Tout') return true;
      return film.date?.endsWith(activeYear);
    });

    const totalFilms   = filtered.length;
    const durations    = filtered.map(f => parseDuration(f.duree));
    const totalMinutes = durations.reduce((a, b) => a + b, 0);
    const avgDuration  = totalFilms > 0 ? Math.round(totalMinutes / totalFilms) : 0;

    const notes = filtered
      .map(f => parseFloat(String(f.note).replace(',', '.')))
      .filter(n => !isNaN(n) && n > 0);
    const avgNote = notes.length > 0
      ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1)
      : '—';

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
      ? years.reduce((acc, y) => acc + 12 * getPrice(y, 'sub'), 0)
      : (activeYear === currentYear ? now.getMonth() + 1 : 12) * getPrice(activeYear, 'sub');

    const savings      = (totalTicketValue - subscriptionInvestment).toFixed(2);
    const rentability  = subscriptionInvestment > 0
      ? Math.round((totalTicketValue / subscriptionInvestment) * 100)
      : 0;

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      name:      getMonthName(i),
      count:     0,
      note:      0,
      noteCount: 0,
    }));

    filtered.forEach(f => {
      const [, month] = (f.date || '').split('/');
      const mIdx = parseInt(month, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        monthlyData[mIdx].count += 1;
        const val = parseFloat(String(f.note).replace(',', '.'));
        if (!isNaN(val) && val > 0) {
          monthlyData[mIdx].note      += val;
          monthlyData[mIdx].noteCount += 1;
        }
      }
    });

    const chartData = monthlyData.map(d => ({
      ...d,
      note: d.noteCount > 0 ? (d.note / d.noteCount).toFixed(1) : 0,
    }));

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
      totalHours:   Math.floor(totalMinutes / 60),
      totalMins:    totalMinutes % 60,
      avgNote,
      avgDuration,
      savings,
      rentability,
      chartData,
      sortedGenres,
      filtered,
    };
  }, [historyData, activeYear, pricing]);

  // ── Animated KPI values ───────────────────────────────────────────────────
  const animatedFilms       = useCountUp(processedData.totalFilms,  800, 0);
  const animatedRentability = useCountUp(processedData.rentability, 900, 0);
  const animatedHours       = useCountUp(processedData.totalHours,  750, 0);
  const animatedSavings     = useCountUp(
    Math.round(parseFloat(processedData.savings)),
    850,
    0
  );

  // Rentability colour tier
  const rentColor =
    processedData.rentability >= 100 ? 'text-emerald-400' :
    processedData.rentability >= 70  ? 'text-amber-400'   :
                                       'text-rose-400';

  const scrolled = scrollY > 20;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-outfit"
    >
      {/* ── APP HEADER ───────────────────────────────────────────────────── */}
      <AppHeader
        title={userName}
        subtitle="Cinema Analytics"
        scrolled={scrolled}
        rightSlot={
          <Avatar3D
            src={userAvatar}
            size={40}
            primary="var(--theme-accent)"
            glow="var(--theme-accent-muted)"
            borderWidth={2}
          />
        }
      />

      {/*
        ── PAGE CONTENT ────────────────────────────────────────────────────
        paddingTop clears the fixed header.
      */}
      <div
        className="px-6"
        style={{ paddingTop: 'var(--header-height, 5rem)' }}
      >

        {/* ════════════════════════════════════════════════════════════════
            HERO BLOCK — always visible above the fold
        ════════════════════════════════════════════════════════════════ */}
        <section className="pt-4 pb-2">

          {/* PRIMARY KPIs ─────────────────────────────────────────────── */}
          <div className="flex items-end justify-between mb-6">

            {/* Left: total films */}
            <div className="flex flex-col">
              <span
                className="font-galinoy leading-none tracking-tighter text-[var(--theme-text)]"
                style={{ fontSize: 'clamp(72px, 22vw, 108px)' }}
              >
                {animatedFilms}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--theme-text)] opacity-30 mt-1">
                Films vus
              </span>
            </div>

            {/* Right: rentability */}
            <div className="flex flex-col items-end">
              <div className={`flex items-baseline gap-1 ${rentColor}`}>
                <Zap size={14} fill="currentColor" className="mb-1 flex-shrink-0" />
                <span
                  className="font-galinoy leading-none tracking-tighter"
                  style={{ fontSize: 'clamp(40px, 12vw, 60px)' }}
                >
                  {animatedRentability}
                  <span
                    className="font-outfit font-black"
                    style={{ fontSize: 'clamp(18px, 5vw, 24px)' }}
                  >
                    %
                  </span>
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text)] opacity-30 mt-1">
                Rentabilité
              </span>
            </div>
          </div>

          {/* YEAR PICKER ──────────────────────────────────────────────── */}
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 mb-5"
            role="group"
            aria-label="Filtrer par année"
          >
            {['Tout', ...processedData.years].map((y) => (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                className={`
                  flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black
                  uppercase tracking-wider transition-all border
                  min-h-[2.75rem] flex items-center
                  ${activeYear === y
                    ? 'bg-[var(--theme-text)] text-[var(--theme-bg)] border-[var(--theme-text)]'
                    : 'bg-transparent border-[var(--theme-border)] text-[var(--theme-text)] opacity-40'
                  }
                `}
              >
                {y}
              </button>
            ))}
          </div>

          {/* SECONDARY METRIC PILLS ───────────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">

            {/* Hours */}
            <div className="flex-shrink-0 flex items-center gap-2 px-4 h-11 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)]">
              <Clock size={13} className="text-[var(--theme-text)] opacity-30 flex-shrink-0" />
              <span className="font-galinoy text-lg leading-none text-[var(--theme-text)]">
                {animatedHours}
                <span className="text-[var(--theme-accent)] font-outfit font-black text-[11px] ml-0.5">h</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-text)] opacity-25">
                En salle
              </span>
            </div>

            {/* Avg note */}
            <div className="flex-shrink-0 flex items-center gap-2 px-4 h-11 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)]">
              <Star size={13} className="text-[var(--theme-text)] opacity-30 flex-shrink-0" />
              <span className="font-galinoy text-lg leading-none text-[var(--theme-text)]">
                {processedData.avgNote}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-text)] opacity-25">
                Moy.
              </span>
            </div>

            {/* Net savings */}
            <div className="flex-shrink-0 flex items-center gap-2 px-4 h-11 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-border)]">
              <TrendingUp size={13} className="text-emerald-400 flex-shrink-0" />
              <span className="font-galinoy text-lg leading-none text-emerald-400">
                {animatedSavings > 0 ? '+' : ''}{animatedSavings}
                <span className="font-outfit font-black text-[11px] ml-0.5">€</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-text)] opacity-25">
                Économisé
              </span>
            </div>

          </div>
        </section>

        {/* ── DECORATIVE RULE ──────────────────────────────────────────── */}
        <div
          className="my-8 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, var(--theme-border), transparent)',
          }}
        />

        {/* ════════════════════════════════════════════════════════════════
            COLLAPSIBLE SECTIONS
        ════════════════════════════════════════════════════════════════ */}

        {/* ── ACTIVITÉ ─────────────────────────────────────────────────── */}
        <CollapsibleSection label="Activité" defaultOpen={true}>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={processedData.chartData}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--theme-accent)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--theme-accent)" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--theme-text)"
                  opacity={0.05}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--theme-text)', opacity: 0.3, fontSize: 10 }}
                />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--theme-accent)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  dot={false}
                  activeDot={{ r: 5, fill: 'var(--theme-accent)', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleSection>

        {/* ── GENRES ───────────────────────────────────────────────────── */}
        <CollapsibleSection
          label="Genres"
          badge={processedData.sortedGenres.length}
          defaultOpen={false}
        >
          <div className="space-y-5">
            {processedData.sortedGenres.map(([name, count], idx) => {
              const percentage = Math.round(
                (count / processedData.totalFilms) * 100
              );
              return (
                <div key={name} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold tracking-tight text-[var(--theme-text)]">
                      {name}
                    </span>
                    <span className="text-[10px] font-black opacity-30 text-[var(--theme-text)]">
                      {count} FILMS
                    </span>
                  </div>
                  <div className="h-[3px] w-full bg-[var(--theme-text)] bg-opacity-5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[var(--theme-text)] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.07, ease: 'easeOut' }}
                      style={{ opacity: 0.8 - idx * 0.12 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ── DERNIÈRES SÉANCES ─────────────────────────────────────────── */}
        <CollapsibleSection
          label="Dernières séances"
          badge={Math.min(processedData.filtered.length, 5)}
          defaultOpen={false}
        >
          <div className="space-y-0">
            {processedData.filtered.slice(0, 5).map((film, i) => (
              <div
                key={i}
                onClick={() => setSelectedFilm(film)}
                className="flex items-center gap-4 py-4 cursor-pointer active:bg-[var(--theme-text)]/5 rounded-2xl px-2 -mx-2 transition-colors group"
              >
                {/* Poster */}
                <div className="w-12 h-[4.5rem] rounded-xl overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)] flex-shrink-0 shadow-sm">
                  <SmartPoster
                    afficheInitiale={film.affiche}
                    titre={film.titre}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div
                  className="flex-1 min-w-0 border-b border-[var(--theme-border)] pb-4"
                  style={{ borderBottomWidth: i === 4 ? 0 : 1 }}
                >
                  <div className="flex justify-between items-start gap-2 mb-0.5">
                    <h4 className="font-outfit font-bold text-[15px] text-[var(--theme-text)] truncate leading-tight">
                      {film.titre}
                    </h4>
                    {film.note && (
                      <span className="text-[11px] font-black text-[var(--theme-accent)] flex-shrink-0 font-galinoy italic">
                        {String(film.note).replace(',', '.')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-[var(--theme-text)] opacity-35 uppercase tracking-wider">
                      {film.date}
                    </span>
                    {film.genre && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[var(--theme-text)] opacity-15" />
                        <span className="text-[10px] font-medium text-[var(--theme-text)] opacity-35 truncate">
                          {film.genre}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Bottom breathing room above the nav bar */}
        <div className="h-8" />

      </div>
    </div>
  );
}