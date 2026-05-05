import React, { useState, useMemo, useEffect } from 'react';
import { GENRE_COLORS } from '../constants';
import { SmartPoster } from '../components/SmartPoster';
import { AppHeader } from '../components/AppHeader';
import { SlidersHorizontal, X, Ticket } from 'lucide-react';

// ── CUSTOM ASSETS (Inchangés) ────────────────────────────────────────────────

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
    <span className="text-[9px] font-black uppercase text-white">Coup de coeur</span>
  </div>
);

// ── UI SUB-COMPONENTS (Inchangés) ─────────────────────────────────────────────

function FeatureCard({ film, onClick }) {
  const noteDisplay = film.note ? String(film.note).replace(',', '.') : null;
  return (
    <div onClick={onClick} className="relative w-full rounded-[2.5rem] overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-500 mb-10 aspect-[4/3] shadow-2xl group">
      <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent to-60%" />
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
        <div className="flex flex-col gap-2">{film.coupDeCoeur && <FavoriPill />}{film.capucine && <CapucinePill />}</div>
        {film.numero && <span className="bg-black/20 backdrop-blur-md border border-white/10 text-white/90 text-[10px] font-black px-3 py-1.5 rounded-full tracking-[0.2em]">#{film.numero}</span>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-8 pt-20">
        <div className="flex items-end justify-between gap-6">
          <div className="flex-1">
            {film.genre && <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border mb-3 ${GENRE_COLORS[film.genre] || 'border-white/20 text-white/60'}`}>{film.genre}</span>}
            <h3 className="font-galinoy text-white text-5xl italic leading-[0.85]">{film.titre}</h3>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mt-3 block">{film.date}</span>
          </div>
          {noteDisplay && <span className="font-galinoy text-7xl italic leading-none text-white">{noteDisplay}</span>}
        </div>
      </div>
    </div>
  );
}

function StandardRow({ film, onClick, showSeparator }) {
  const noteDisplay = film.note ? String(film.note).replace(',', '.') : null;
  return (
    <div className="group">
      <div onClick={onClick} className="grid grid-cols-[auto_1fr_auto] items-center gap-5 py-5 px-2 pr-4 cursor-pointer active:bg-white/5 rounded-2xl transition-colors">
        <div className="relative w-16 h-22 rounded-xl overflow-hidden bg-[var(--theme-surface)] border border-[var(--theme-border)]">
          <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-black text-[var(--theme-text)] opacity-30 tracking-widest block mb-1">#{film.numero}</span>
          <p className="font-galinoy text-2xl leading-tight text-[var(--theme-text)]">{film.titre}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] font-medium text-[var(--theme-text-secondary)] opacity-60">{film.date}</span>
            <div className="flex items-center gap-2">
              {film.capucine && <img src="https://i.imgur.com/lg1bkrO.png" className="w-3 h-3 object-contain" alt="Capucines" />}
              {film.coupDeCoeur && <ChubbyHeart className="w-3.5 h-3.5 text-[var(--theme-accent)]" />}
              <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium">{film.genre}</span>
            </div>
          </div>
        </div>
        {noteDisplay && <div className="font-galinoy text-3xl italic text-[var(--theme-text-secondary)] opacity-40">{noteDisplay}</div>}
      </div>
      {showSeparator && <div className="h-px bg-[var(--theme-border)] mx-2 opacity-30" />}
    </div>
  );
}

function FilterSheet({ isOpen, onClose, activeYear, setActiveYear, activeType, setActiveType, availableYears, onReset }) {
  if (!isOpen) return null;

  const types = [
    { id: 'all', label: 'Tout' }, 
    { id: 'coeur', label: 'Favoris' }, 
    { id: 'capucine', label: 'Capucine' }
  ];

  // Helper pour uniformiser le style des boutons actifs/inactifs
  const getBtnClass = (isActive) => `
    px-5 py-2.5 rounded-xl text-[11px] font-black uppercase border transition-all duration-200
    ${isActive 
      ? 'bg-[var(--theme-accent)] text-[var(--theme-bg)] border-transparent shadow-sm' 
      : 'bg-transparent text-[var(--theme-text)] border-[var(--theme-border)] opacity-60 active:scale-95'
    }
  `;

  return (
    <div className="fixed inset-0 z-[300] flex items-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sheet Container */}
      <div className="relative w-full rounded-t-[3rem] bg-[var(--theme-surface)] border-x border-t border-[var(--theme-border)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] px-8 pt-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Handle de drag visuel */}
        <div className="w-12 h-1.5 rounded-full bg-[var(--theme-text)] opacity-10 mx-auto mb-8" />

        <div className="space-y-8">
          
          {/* Section: Type */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-30">Type</p>
            <div className="flex gap-2">
              {types.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setActiveType(t.id)} 
                  className={getBtnClass(activeType === t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Année */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-30">Année</p>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setActiveYear('all')} 
                className={getBtnClass(activeYear === 'all')}
              >
                Tout
              </button>
              
              {availableYears.map(y => (
                <button 
                  key={y} 
                  onClick={() => setActiveYear(y)} 
                  className={getBtnClass(activeYear === y)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Action: Reset */}
          <button 
            onClick={() => { onReset(); onClose(); }} 
            className="w-full py-4 rounded-2xl border border-[var(--theme-border)] text-[var(--theme-text)] opacity-40 uppercase text-[11px] font-black hover:opacity-100 transition-opacity active:bg-[var(--theme-text)]/5"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN HISTORY ────────────────────────────────────────────────────────────

export function History({ historyData = [], setSelectedFilm, displayCount, scrollY = 0 }) {
  const [activeType, setActiveType] = useState('all');
  const [activeYear, setActiveYear] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('');

  const scrolled = scrollY > 20;
  const hasActiveFilters = activeType !== 'all' || activeYear !== 'all';

  const anneesDisponibles = useMemo(() => [
    ...new Set(historyData.map(f => f.date?.split('/')[2]).filter(Boolean))
  ].sort((a, b) => b - a), [historyData]);

  const filteredData = useMemo(() => {
    let data = historyData.filter(f => !searchQuery || f.titre.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeType === 'coeur') data = data.filter(f => f.coupDeCoeur);
    if (activeType === 'capucine') data = data.filter(f => f.capucine);
    if (activeYear !== 'all') data = data.filter(f => f.date?.endsWith(activeYear));
    return data.sort((a, b) => {
      const p = (d) => { const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd); };
      return p(b.date) - p(a.date);
    });
  }, [historyData, activeType, activeYear, searchQuery]);

  const groupedByMonth = useMemo(() => {
    const groups = {};
    filteredData.slice(0, displayCount).forEach(film => {
      const parts = film.date.split('/');
      const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(parts[2], parseInt(parts[1]) - 1));
      const key = `${monthName} ${parts[2]}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(film);
    });
    return Object.entries(groups);
  }, [filteredData, displayCount]);

  useEffect(() => {
    if (scrollY < 60) {
      setCurrentMonth('');
      return;
    }
    const sections = document.querySelectorAll('[data-month]');
    let found = "";
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      // On déclenche le changement de mois un peu plus tôt
      if (rect.top <= 100) found = section.getAttribute('data-month');
    });
    if (found !== currentMonth) setCurrentMonth(found);
  }, [scrollY, currentMonth]);

  const rightSlot = (
    <div className="flex items-center gap-2">
      <button onClick={() => setIsFilterOpen(true)} className={`relative w-11 h-11 rounded-full flex items-center justify-center border transition-all ${hasActiveFilters ? 'bg-[var(--theme-accent)] border-transparent text-[var(--theme-bg)]' : 'bg-[var(--theme-surface)] border-[var(--theme-border)] text-[var(--theme-text)]'}`}>
        <SlidersHorizontal size={16} />
        {hasActiveFilters && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[var(--theme-bg)]" />}
      </button>
      <button onClick={() => setIsSearchOpen(true)} className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-text)]">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] font-outfit">
      
      <AppHeader 
        title="Journal" 
        subtitle={currentMonth} 
        scrolled={scrolled} 
        rightSlot={rightSlot} 
      />

      <header 
        className="px-8 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-2 transition-all duration-500"
        style={{ 
          opacity: Math.max(0, 1 - scrollY / 60),
          transform: `translateY(${-scrollY * 0.1}px)`,
        }}
      >
        <h1 className="font-galinoy italic text-4xl capitalize tracking-tight opacity-90 text-left">
          Journal
        </h1>
      </header>

      <main className="px-5 pb-8">
        {groupedByMonth.length === 0 ? (
          <div className="py-32 text-center opacity-20">
            <Ticket size={48} className="mx-auto mb-4" />
            <p className="font-galinoy text-4xl italic">Vide</p>
          </div>
        ) : (
          groupedByMonth.map(([month, films]) => (
            <section key={month} className="mb-12" data-month={month}>
              
              {/* STICKY : Top 0 pour coller en haut de l'écran */}
              <div className="sticky top-0 z-[80] -mx-5 px-8 pt-[calc(env(safe-area-inset-top)+1.2rem)] pb-4 bg-[var(--theme-bg)]/80 backdrop-blur-xl">
                <h2 className="font-galinoy italic text-4xl capitalize tracking-tight text-[var(--theme-text)]">
                  {month}
                </h2>
              </div>

              <div className="mt-4">
                {films.map((film, idx) => {
                  const isHighlighted = parseFloat(String(film.note).replace(',', '.')) >= 4.5 || film.coupDeCoeur;
                  return isHighlighted ? (
                    <FeatureCard key={idx} film={film} onClick={() => setSelectedFilm(film)} />
                  ) : (
                    <StandardRow 
                      key={idx} 
                      film={film} 
                      onClick={() => setSelectedFilm(film)} 
                      showSeparator={!!films[idx+1] && !(parseFloat(String(films[idx+1].note).replace(',', '.')) >= 4.5 || films[idx+1].coupDeCoeur)} 
                    />
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {/* SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[400] bg-[var(--theme-bg)] p-8 pt-[env(safe-area-inset-top)] flex flex-col">
          <div className="flex justify-end mb-12 mt-4">
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--theme-surface)] border border-[var(--theme-border)]"><X size={24} /></button>
          </div>
          <input autoFocus className="w-full bg-transparent py-6 font-galinoy text-6xl italic outline-none border-b-2 border-[var(--theme-accent)] text-[var(--theme-text)] placeholder:opacity-10" placeholder="Rechercher…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      )}

      <FilterSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} activeYear={activeYear} setActiveYear={setActiveYear} activeType={activeType} setActiveType={setActiveType} availableYears={anneesDisponibles} onReset={() => {setActiveType('all'); setActiveYear('all');}} />
    </div>
  );
}