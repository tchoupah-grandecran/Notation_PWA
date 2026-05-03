import { useState, useMemo } from 'react';
import { GENRE_COLORS, THEME_COLORS } from '../constants';
import { SmartPoster } from '../components/SmartPoster';

export function History({
  historyData = [],
  ratingScale,
  isScrolled,
  setSelectedFilm,
  displayCount,
  currentThemeKey,
}) {
  const [activeType, setActiveType] = useState('all'); 
  const [activeYear, setActiveYear] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');

  const activeTheme = useMemo(() => {
    return THEME_COLORS[currentThemeKey] || THEME_COLORS['dark-grey'] || { bgGradient: '#000', primary: '#fff' };
  }, [currentThemeKey]);

  const anneesDisponibles = useMemo(() => [
    ...new Set(historyData.map((f) => f.date?.split('/')[2]).filter(Boolean))
  ].sort((a, b) => b - a), [historyData]);

  const filteredHistory = useMemo(() => {
    let data = [...historyData];
    if (searchQuery) data = data.filter(f => f.titre.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // CORRECTION DU FILTRE TOP (>= 4 si échelle de 5, >= 8 si échelle de 10)
    if (activeType === 'coeur') data = data.filter(f => f.coupDeCoeur);
    if (activeType === 'capucine') data = data.filter(f => f.capucine);
    if (activeType === 'top') {
      const threshold = ratingScale === 5 ? 4 : 8;
      data = data.filter(f => Number(f.note?.replace(',', '.')) >= threshold);
    }
    
    if (activeYear !== 'all') data = data.filter(f => f.date?.endsWith(activeYear));

    data.sort((a, b) => {
      const parseDate = (d) => {
        if (!d) return new Date(0);
        const [day, month, year] = d.split('/').map(Number);
        return new Date(year, month - 1, day);
      };
      const dateA = parseDate(a.date), dateB = parseDate(b.date);
      if (dateA.getTime() !== dateB.getTime()) return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      return sortOrder === 'newest' ? (parseInt(b.numero) || 0) - (parseInt(a.numero) || 0) : (parseInt(a.numero) || 0) - (parseInt(b.numero) || 0);
    });
    return data;
  }, [historyData, activeType, activeYear, searchQuery, sortOrder, ratingScale]);

  return (
    <div 
      className="min-h-screen font-outfit pb-32 transition-all duration-1000"
      style={{ background: activeTheme.bgGradient, '--color-primary': activeTheme.primary }}
    >
      <header className={`z-50 sticky top-0 w-full transition-all duration-500 ${
        isScrolled ? 'bg-black/20 backdrop-blur-2xl border-b border-white/5' : 'bg-transparent'
      }`}>
        {/* PADDING RÉDUIT ICI (pt-10 au lieu de pt-16) */}
        <div className={`px-6 transition-all duration-500 flex justify-between items-center ${isScrolled ? 'py-4' : 'pt-10 pb-4'}`}>
          <h1 className={`font-galinoy text-white transition-all duration-500 tracking-tight ${isScrolled ? 'text-2xl' : 'text-5xl'}`}>
            Historique
          </h1>
          
          <div className="flex items-center gap-1">
            <button onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')} className="p-2 text-white/40 hover:text-white transition-colors">
              <svg className={`w-5 h-5 transition-transform ${sortOrder === 'oldest' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path d="M3 4h13M3 8h9M3 12h5m0 5l3 3 3-3m-3 3V10" />
              </svg>
            </button>
            <button onClick={() => setIsSearchOpen(true)} className="p-2 text-white/40 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-[60] flex items-center px-8 animate-in fade-in duration-300">
            <input
              autoFocus
              className="flex-1 bg-transparent border-none text-3xl font-galinoy text-white outline-none"
              placeholder="Chercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="ml-4 p-2 text-[var(--color-primary)] font-black text-[10px] uppercase tracking-widest">
              Fermer
            </button>
          </div>
        )}
      </header>

      <main className="px-6 mt-4">
        <section className={`mb-8 space-y-5 transition-all duration-700 ${isScrolled ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {['all', 'coeur', 'top', 'capucine'].map((id) => (
              <button
                key={id}
                onClick={() => setActiveType(id)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeType === id ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/5 text-white/20 border border-white/5'
                }`}
              >
                {id === 'all' ? 'Tous' : id === 'coeur' ? 'Favoris' : id === 'top' ? 'Le Top' : 'Capucine'}
              </button>
            ))}
          </div>

          <div className="flex gap-4 overflow-x-auto scrollbar-hide px-1">
            <button onClick={() => setActiveYear('all')} className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${activeYear === 'all' ? 'text-[var(--color-primary)]' : 'text-white/10'}`}>
              Flux global
            </button>
            {anneesDisponibles.map(year => (
              <button key={year} onClick={() => setActiveYear(year)} className={`text-[8px] font-black uppercase tracking-[0.2em] transition-colors ${activeYear === year ? 'text-[var(--color-primary)]' : 'text-white/10'}`}>
                {year}
              </button>
            ))}
          </div>
        </section>

        {/* GAP RESSERRÉ ENTRE LES CARDS (space-y-4) */}
        <div className="space-y-4">
          {filteredHistory.slice(0, displayCount).map((film, index) => (
            <div
              key={`${film.titre}-${index}`}
              onClick={() => setSelectedFilm(film)}
              className="group flex gap-4 active:scale-[0.98] transition-transform duration-300"
            >
              <div className="w-20 h-28 flex-shrink-0 relative">
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/5 shadow-xl">
                  <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex flex-col justify-center flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 opacity-30">
                   <span className="text-[var(--color-primary)] text-[7px] font-black italic">#{film.numero}</span>
                   <span className="text-white text-[7px] font-black uppercase">{film.date}</span>
                </div>
                
                <h4 className="font-galinoy text-xl text-white leading-tight mb-1 group-hover:text-[var(--color-primary)] transition-colors truncate">
                  {film.titre}
                </h4>
                
                <div className="flex items-center gap-2.5">
                  <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${GENRE_COLORS[film.genre] || 'border-white/10 text-white/30'}`}>
                    {film.genre}
                  </span>
                  {film.note && (
                    <span className="font-galinoy text-base text-white/90 italic">{film.note}<span className="text-[9px] opacity-30 not-italic ml-0.5">/{ratingScale}</span></span>
                  )}
                  {film.coupDeCoeur && <span className="text-red-500 text-[10px]">♥</span>}
                  {film.capucine && <img src="https://i.imgur.com/lg1bkrO.png" className="w-3 h-3 opacity-80" alt="Capucine" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}