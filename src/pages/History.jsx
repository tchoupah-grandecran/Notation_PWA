import { useState, useMemo } from 'react';
import { GENRE_COLORS, THEME_COLORS } from '../constants';
import { SmartPoster } from '../components/SmartPoster';

const ChubbyHeart = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

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

  const activeTheme = useMemo(() => THEME_COLORS[currentThemeKey] || THEME_COLORS['dark-grey'], [currentThemeKey]);

  const themeBgColor = useMemo(() => {
    const colors = activeTheme.bgGradient.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/g);
    return colors ? colors[0] : '#111111';
  }, [activeTheme]);

  const anneesDisponibles = useMemo(() => [
    ...new Set(historyData.map((f) => f.date?.split('/')[2]).filter(Boolean))
  ].sort((a, b) => b - a), [historyData]);

  const filteredData = useMemo(() => {
    let data = [...historyData];
    if (searchQuery) data = data.filter(f => f.titre.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeType === 'coeur') data = data.filter(f => f.coupDeCoeur);
    if (activeType === 'capucine') data = data.filter(f => f.capucine);
    if (activeYear !== 'all') data = data.filter(f => f.date?.endsWith(activeYear));
    
    return data.sort((a, b) => {
      const parseDate = (d) => {
        const [day, month, year] = d.split('/').map(Number);
        return new Date(year, month - 1, day);
      };
      return parseDate(b.date) - parseDate(a.date);
    });
  }, [historyData, activeType, activeYear, searchQuery]);

  const groupedByMonth = useMemo(() => {
    const groups = {};
    filteredData.slice(0, displayCount).forEach(film => {
      const [day, month, year] = film.date.split('/');
      const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(year, month - 1));
      const key = `${monthName} ${year}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(film);
    });
    return Object.entries(groups);
  }, [filteredData, displayCount]);

  return (
    <div 
      className="min-h-screen font-outfit pb-40 transition-colors duration-1000"
      style={{ background: activeTheme.bgGradient, '--color-primary': activeTheme.primary }}
    >
      <header 
        className="z-[100] sticky top-0 w-full transition-all duration-700 pt-[env(safe-area-inset-top)]"
        style={{
          background: isScrolled 
            ? `linear-gradient(to bottom, ${themeBgColor} 0%, ${themeBgColor} 80%, transparent 100%)` 
            : 'transparent'
        }}
      >
        <div className={`px-8 flex justify-between items-center transition-all duration-500 ${
          isScrolled ? 'h-20' : 'pt-10 pb-6'
        }`}>
          <div className="flex items-baseline gap-3">
            <h1 className={`font-galinoy text-white italic tracking-tight leading-none transition-all duration-500 ${
              isScrolled ? 'text-3xl' : 'text-5xl'
            }`}>
              Journal
            </h1>
          </div>
          
          <button 
            onClick={() => setIsSearchOpen(true)}
            className={`rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 transition-all ${
              isScrolled ? 'w-10 h-10' : 'w-12 h-12 hover:bg-white/10'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        <div className={`px-8 overflow-hidden transition-all duration-500 ease-in-out ${
          isScrolled ? 'max-h-0 opacity-0' : 'max-h-40 pb-8'
        }`}>
           <div className="flex flex-col gap-4">
            <div className="flex gap-5 overflow-x-auto scrollbar-hide items-center border-b border-white/5 pb-3">
              {['all', ...anneesDisponibles].map(year => (
                <button 
                  key={year} 
                  onClick={() => setActiveYear(year)} 
                  className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${activeYear === year ? 'text-white' : 'text-white/20'}`}
                >
                  {year === 'all' ? 'Tout' : year}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {['all', 'coeur', 'capucine'].map((id) => (
                <button key={id} onClick={() => setActiveType(id)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] transition-all border ${activeType === id ? 'bg-white text-black border-white' : 'bg-white/5 text-white/30 border-white/5'}`}>
                  {id === 'all' ? 'Tout' : id === 'coeur' ? 'Favoris' : 'Capucine'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 relative">
        {groupedByMonth.map(([month, films]) => (
          <section key={month} className="mb-20 relative">
            <h2 className={`font-galinoy text-white/40 italic tracking-tighter capitalize sticky transition-all duration-700 z-0 pointer-events-none ${
              isScrolled ? 'text-4xl top-24 mb-4 opacity-40' : 'text-7xl mb-10 opacity-100'
            }`}>
              {month}
            </h2>

            {/* Pas de gap ici pour éviter le décalage rose */}
            <div className="flex flex-col relative z-10">
              {films.map((film, idx) => {
                const isHighlight = film.coupDeCoeur || parseFloat(film.note?.replace(',', '.')) >= 4.5;
                
                if (isHighlight) {
                  return (
                    <div 
                      key={`${film.titre}-${idx}`} 
                      onClick={() => setSelectedFilm(film)}
                      className="group relative w-full aspect-[2/3] sm:aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-2xl cursor-pointer mb-12 transition-all active:scale-[0.98]"
                    >
                      <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover block transition-transform duration-[1.5s] group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 sm:p-12">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="font-outfit font-black text-[9px] uppercase tracking-[0.4em] text-[var(--color-primary)]">
                            #{film.numero} • {film.date}
                          </span>
                          {film.coupDeCoeur && <ChubbyHeart className="w-4 h-4 text-red-500" />}
                        </div>
                        <h3 className="font-galinoy text-4xl sm:text-5xl text-white italic leading-tight tracking-tight mb-6 group-hover:text-[var(--color-primary)] transition-colors">
                          {film.titre}
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white/80">
                            {film.genre}
                          </span>
                          <div className="ml-auto">
                            <span className="font-galinoy text-6xl text-[var(--color-primary)] italic tracking-tighter leading-none">{film.note}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={`${film.titre}-${idx}`} className="group">
                    <div 
                      onClick={() => setSelectedFilm(film)} 
                      className="flex items-center gap-8 py-10 px-6 cursor-pointer transition-all hover:bg-white/[0.03] rounded-[2rem]"
                    >
                      <div className="relative w-24 h-36 flex-shrink-0">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                          <SmartPoster 
                            afficheInitiale={film.affiche} 
                            titre={film.titre} 
                            className="w-full h-full object-cover block" 
                          />
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2 opacity-30 font-black text-[9px] uppercase tracking-[0.3em] text-white">
                           <span>#{film.numero}</span>
                           <span>•</span>
                           <span>{film.date}</span>
                        </div>
                        
                        <h3 className="font-galinoy text-3xl text-white italic leading-snug group-hover:text-[var(--color-primary)] transition-all mb-4">
                          {film.titre}
                        </h3>
                        
                        <div className="flex items-center gap-5">
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border ${GENRE_COLORS[film.genre] || 'border-white/10 text-white/30'}`}>
                            {film.genre}
                          </span>
                          {film.note && (
                            <span className="font-galinoy text-3xl text-white/30 italic tracking-tighter group-hover:text-white/80 transition-colors">
                              {film.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {idx < films.length - 1 && (
                      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl p-10 pt-[env(safe-area-inset-top)] animate-in fade-in duration-300">
          <div className="flex justify-end mb-12">
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-4 text-white/20 hover:text-white transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
          <input 
            autoFocus
            className="w-full bg-transparent border-b border-white/10 py-6 font-galinoy text-5xl text-white outline-none italic placeholder:text-white/5 transition-all"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}