import { useState } from 'react';
import { GENRE_COLORS } from '../constants';
import { SmartPoster } from '../components/SmartPoster';
import { ImaxTag } from '../components/ImaxTag';

export function History({
  historyData,
  isLoadingHistory,
  ratingScale,
  isScrolled,
  handleScan,
  setSelectedFilm,
  displayCount,
  setDisplayCount,
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');

  const anneesDisponibles = [
    ...new Set(
      historyData.map((f) => {
        const parts = f.date?.split('/');
        return parts?.length === 3 ? parts[2] : null;
      }).filter(Boolean)
    ),
  ].sort((a, b) => b - a);

  const parseDateToMs = (film) => {
    const p = film.date?.split('/');
    if (!p || p.length < 3) return 0;
    return new Date(p[2], p[1] - 1, p[0]).getTime();
  };

  let filteredHistory = historyData.filter((film) => {
    let categoryMatch = true;
    if (activeFilter === 'coeur') categoryMatch = film.coupDeCoeur;
    else if (activeFilter === 'capucine') categoryMatch = film.capucine;
    else if (activeFilter === 'top') categoryMatch = Number(film.note) >= (ratingScale === 5 ? 4 : 8);
    else if (anneesDisponibles.includes(activeFilter)) categoryMatch = film.date?.endsWith(activeFilter);
    const searchMatch = !searchQuery || film.titre.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  filteredHistory.sort((a, b) =>
    sortOrder === 'oldest' ? parseDateToMs(a) - parseDateToMs(b) : parseDateToMs(b) - parseDateToMs(a)
  );

  return (
    <div className="animate-in fade-in duration-300">
      {/* HEADER STICKY
          — fond pleinement opaque quand la recherche est ouverte
            pour masquer le contenu scrollé derrière               */}
      <header className={`z-40 sticky top-0 w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] backdrop-blur-2xl border-b ${
        isSearchOpen
          ? 'bg-[var(--color-bg)] pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg'
          : isScrolled
          ? 'bg-[var(--color-bg)]/80 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg'
          : 'bg-[var(--color-bg)]/80 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 border-transparent shadow-none'
      }`}>

        <div className="px-6 flex justify-between items-center">

          {/* Titre — fondu + légère translation vers la gauche à l'ouverture */}
          <div className={`flex flex-col transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isSearchOpen ? 'opacity-0 -translate-x-3 pointer-events-none' : 'opacity-100 translate-x-0'
          }`}>
            <p className={`font-bold uppercase tracking-widest text-[var(--color-primary)] transition-all duration-500 origin-left ${
              isScrolled ? 'opacity-0 h-0 overflow-hidden mb-0 text-[0px]' : 'opacity-100 h-3 text-[10px] mb-1'
            }`}>
              {filteredHistory.length} films
            </p>
            <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 origin-left ${
              isScrolled ? 'text-2xl' : 'text-4xl'
            }`}>
              Mes <br />Films
            </h1>
          </div>

          {/* Zone droite — s'étend quand la recherche est ouverte */}
          <div className={`flex items-center gap-2 transition-all duration-200 min-w-0 ${isSearchOpen ? 'flex-1' : 'flex-shrink-0'}`}>

            {/* ── État FERMÉ : boutons normaux ── */}
            {!isSearchOpen && (
              <>

                {isScrolled && (
                  <button
                    onClick={() => document.getElementById('main-scroll-container').scrollTo({ top: 0, behavior: 'smooth' })}
                    className="animate-bubble flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-accent)] shadow-lg border border-white/20 active:scale-90 transition-transform flex-shrink-0"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                      <line x1="2" y1="14" x2="6" y2="14" /><line x1="10" y1="8" x2="14" y2="8" />
                      <line x1="18" y1="16" x2="22" y2="16" />
                    </svg>
                  </button>
                )}

                <button
                  onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-white/5 bg-white/5 active:scale-90 transition-all flex-shrink-0"
                >
                  {sortOrder === 'newest' ? (
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                  )}
                </button>

                {/* Bouton loupe */}
                <button
                  onClick={() => {
                    setIsSearchOpen(true);
                    setTimeout(() => document.getElementById('searchInput')?.focus(), 50);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-white/5 bg-white/5 active:scale-90 transition-all flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </>
            )}

            {/* ── État OUVERT : barre de recherche pleine largeur ── */}
            {isSearchOpen && (
              <div className="flex items-center gap-3 h-10 px-4 rounded-full bg-white/10 border border-white/15 shadow-lg animate-in fade-in slide-in-from-right-4 duration-200 w-full min-w-0">
                <svg className="w-4 h-4 text-white/40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  id="searchInput"
                  type="text"
                  placeholder="Rechercher un film..."
                  autoFocus
                  className="bg-transparent text-sm flex-1 outline-none text-white font-bold placeholder:text-white/35 min-w-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-white/15 text-white/70 active:scale-90 transition-transform"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Filtres */}
        <div className={`overflow-hidden transition-all duration-500 ${isScrolled || isSearchOpen ? 'max-h-0 opacity-0 mt-0' : 'max-h-20 opacity-100 mt-4'}`}>
          <div className="flex overflow-x-auto gap-2 px-6 pb-2 scrollbar-hide snap-x scroll-px-6">
            
            {/* Bouton TOUS (Reste fixe) */}
            <button onClick={() => setActiveFilter('all')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase ${activeFilter === 'all' ? 'bg-white text-black shadow-md' : 'bg-white/5 border border-white/10 text-white/60'}`}>
              Tous
            </button>
            
            {/* Bouton CAPUCINES (Déjà correct) */}
            <button onClick={() => setActiveFilter(activeFilter === 'capucine' ? 'all' : 'capucine')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase flex items-center gap-2 ${activeFilter === 'capucine' ? 'bg-[#FFD1DC] text-[#4A1040] shadow-md' : 'bg-white/5 border border-[#FFD1DC]/20 text-[#FFD1DC]/60'}`}>
              <img src="https://i.imgur.com/lg1bkrO.png" alt="" className="w-3.5 h-3.5" />Capucines
            </button>
            
            {/* Bouton FAVORIS (Corrigé) */}
            <button onClick={() => setActiveFilter(activeFilter === 'coeur' ? 'all' : 'coeur')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase flex items-center gap-1.5 ${activeFilter === 'coeur' ? 'bg-red-500 text-white shadow-md' : 'bg-white/5 border border-white/10 text-white/60'}`}>
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              Favoris
            </button>
            
            {/* Bouton TOP (Corrigé) */}
            <button onClick={() => setActiveFilter(activeFilter === 'top' ? 'all' : 'top')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase flex items-center gap-1.5 ${activeFilter === 'top' ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5 border border-white/10 text-white/60'}`}>
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
              Top
            </button>
            
            {/* Boutons ANNÉES (Corrigés) */}
            {anneesDisponibles.map((annee) => (
              <button key={annee} onClick={() => setActiveFilter(activeFilter === annee ? 'all' : annee)} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase ${activeFilter === annee ? 'bg-[#FFF] text-black' : 'bg-white/5 border border-white/10 text-white/60'}`}>
                {annee}
              </button>
            ))}
            
            <div className="flex-shrink-0 w-6 h-1" />
          </div>
        </div>
      </header>

      {/* LISTE */}
      <main className="px-6 pt-4 space-y-4">
        {isLoadingHistory ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="flex bg-white/5 border border-white/10 rounded-2xl h-28 relative overflow-hidden">
              <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <div className="w-20 bg-white/5 h-full" />
              <div className="flex-1 p-4 space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : (
          filteredHistory.slice(0, displayCount).map((film, index) => (
            <div
              key={index}
              onClick={() => setSelectedFilm(film)}
              className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden active:scale-[0.98] transition-all cursor-pointer relative min-h-[7.5rem]"
              style={{ borderColor: film.capucine ? 'rgba(255,209,220,0.15)' : 'rgba(255,255,255,0.1)' }}
            >
              {film.numero && (
                <div className="absolute top-0 right-0 bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[9px] font-black px-2 py-1 rounded-bl-lg z-10 border-b border-l border-white/10">
                  #{film.numero}
                </div>
              )}
              <div className="w-24 self-stretch">
                <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-4 px-4">
                <div className="mb-2">
                  <h4 className="font-syne font-bold text-lg leading-tight text-white mb-1 pr-6">{film.titre}</h4>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{film.date}</p>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <ImaxTag salle={film.salle} commentaire={film.commentaire} />
                  <span className={`whitespace-nowrap px-2 py-1 rounded-full text-[10px] font-black uppercase border ${GENRE_COLORS[film.genre] || GENRE_COLORS.default}`}>
                    {film.genre}
                  </span>
                  {film.capucine && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-[#FFD1DC]">
                      <img src="https://i.imgur.com/lg1bkrO.png" alt="Capucine" className="w-3 h-3 object-contain" />
                    </div>
                  )}
                  {film.note && (
                    <span className="text-[var(--color-primary)] font-black text-[11px] bg-[var(--color-primary-muted)] px-2 py-1 rounded-full border border-[var(--color-primary-muted)] shadow-sm flex items-center gap-1">
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                      {film.note}
                    </span>
                  )}
                  {film.coupDeCoeur && (
                    <span className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div className="h-6" />
      </main>
    </div>
  );
}