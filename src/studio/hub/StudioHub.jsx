import React, { useEffect } from 'react';
import { ChevronRight, Layers, Film, Ticket, Sparkles, Star } from 'lucide-react';
import '../../Studio.css';

export default function StudioHub({ isScrolled, onSelectTool, onLock, pendingFilm, historyData, onHeaderRight, onHeaderTitle }) {

  useEffect(() => {
    onHeaderRight?.(
      <button
        onClick={onLock}
        className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 active:scale-90 transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </button>
    );
    return () => onHeaderRight?.(null);
  }, [onLock, onHeaderRight]);

  const getPosterUrl = (url) => {
    if (!url) return '';
    const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';
    return `${proxyBase}?url=${encodeURIComponent(url)}`;
  };

  const bgImage         = pendingFilm?.affiche ? getPosterUrl(pendingFilm.affiche) : null;
  const latestRatedFilm = historyData && historyData.length > 0 ? historyData[0] : null;
  const avisBgImage     = latestRatedFilm?.affiche ? getPosterUrl(latestRatedFilm.affiche) : null;
  const recentPosters   = (historyData || []).filter(f => f.affiche).map(f => getPosterUrl(f.affiche)).slice(0, 16);

  return (
    <div className="studio-hub animate-in fade-in slide-in-from-bottom-4 duration-500 pb-safe-24 font-outfit bg-[var(--theme-bg)] min-h-screen text-[#F0EEF5]">
      <main
        className="space-y-8 pb-12"
        style={{ paddingTop: 'calc(var(--header-total-height, 96px) + 1.5rem)' }}
      >

        {/* ── RECAP CARD ── */}
        <div className="px-6">
          <h2 className="font-outfit font-extrabold text-[var(--theme-text)] text-[10px] tracking-[0.25em] uppercase mb-4">
            L'événement du mois
          </h2>
          <div className="relative cursor-pointer group" onClick={() => onSelectTool('recap')}>
            <div className="absolute inset-0 bg-white/5 border border-white/5 rounded-3xl transform rotate-3 scale-95 transition-transform group-hover:rotate-6 group-active:scale-90 origin-bottom-right"/>
            <div className="absolute inset-0 bg-white/10 border border-white/10 rounded-3xl transform -rotate-2 scale-[0.98] transition-transform group-hover:-rotate-4 group-active:scale-95 origin-bottom-left"/>

            <div className="relative bg-[#050505] border border-white/10 rounded-3xl p-6 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:border-[#E8B200]/40 group-active:scale-[0.98] aspect-[4/3] flex flex-col justify-between">

              {/* Poster mosaic bg */}
              <div className="absolute inset-0 z-0 overflow-hidden opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                <div className="absolute inset-0 flex gap-2 w-[150%] h-[150%] -top-[25%] -left-[25%] transform -rotate-12 scale-110">
                  {Array.from({ length: 4 }).map((_, colIdx) => (
                    <div key={colIdx} className={`flex-1 flex flex-col gap-2 ${colIdx % 2 !== 0 ? 'pt-12' : ''}`}>
                      {Array.from({ length: 4 }).map((_, rowIdx) => {
                        const poster = recentPosters[(colIdx * 4 + rowIdx) % (recentPosters.length || 1)];
                        return poster ? (
                          <div key={rowIdx} className="w-full aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 bg-white/5 shadow-lg">
                            <img src={poster} className="w-full h-full object-cover saturate-[0.8]" crossOrigin="anonymous" alt=""/>
                          </div>
                        ) : (
                          <div key={rowIdx} className="w-full aspect-[2/3] rounded-lg bg-white/5 flex-shrink-0"/>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-30 flex justify-between items-start">
                <div className="bg-[#E8B200] border border-[#E8B200]/50 rounded-full px-3 py-1 flex items-center gap-2 shadow-[0_0_20px_rgba(232,178,0,0.25)]">
                  <Layers size={11} className="text-black" strokeWidth={3}/>
                  <span className="font-outfit font-black text-[9px] text-black uppercase tracking-[0.1em]">6 Slides</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover:border-[#E8B200]/50 transition-colors">
                  <Film size={18} className="text-white/70 group-hover:text-[#E8B200] group-hover:scale-110 transition-all" strokeWidth={1.5}/>
                </div>
              </div>

              <div className="relative z-30">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="h-[1px] w-9 bg-[#E8B200]/60"/>
                  <span className="font-outfit font-bold text-[9px] text-[#E8B200] uppercase tracking-[0.35em]">Rewind exclusif</span>
                </div>
                <h3 className="font-galinoy italic text-4xl text-white leading-[0.95] tracking-tight mb-3 drop-shadow-lg">
                  Récap'<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B200] via-[#FFD341] to-[#E8B200] animate-gradient-x animate-title-glow">
                    Mensuel
                  </span>
                </h3>
                <p className="font-outfit text-sm text-white/70 font-medium max-w-[88%] leading-relaxed drop-shadow-md">
                  Générez votre <span className="text-white">fresque narrative</span> et partagez vos moments forts du mois.
                </p>
              </div>

              <div className="absolute bottom-4 right-6 opacity-30 group-hover:opacity-100 transition-opacity z-30">
                <ChevronRight className="text-white group-hover:translate-x-1.5 transition-transform" size={20} strokeWidth={2.5}/>
              </div>
            </div>
          </div>
        </div>

        {/* ── QUICK CREATE CARDS ── */}
        <div>
          <h2 className="px-6 font-outfit font-extrabold text-[var(--theme-text)] text-[10px] tracking-[0.25em] uppercase mb-4">
            Créations Rapides
          </h2>
          <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide">

            {/* Story Séance */}
            <div
              onClick={() => onSelectTool('seance')}
              className="snap-start shrink-0 relative w-[160px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group shadow-xl border border-white/10 bg-[#050505]"
            >
              {bgImage ? (
                <>
                  <img src={bgImage} className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-110 saturate-[0.8]" alt="" crossOrigin="anonymous"/>
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/50 to-black/20 group-hover:via-black/60 transition-colors"/>
                </>
              ) : (
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#121212] to-[#050505] opacity-80">
                  <div className="absolute inset-0 mix-blend-overlay opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}/>
                </div>
              )}
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 group-active:scale-95 transition-transform">
                <div className="w-8 h-8 rounded-full bg-black/50 border border-white/15 backdrop-blur-md flex items-center justify-center self-end group-hover:border-[#E8B200]/40 transition-colors">
                  <Ticket size={16} className="text-white/70 group-hover:text-[#E8B200] transition-colors" strokeWidth={1.5}/>
                </div>
                <div>
                  <h3 className="font-galinoy italic text-xl text-white leading-tight mb-1">Story<br/>Séance</h3>
                  <p className="font-outfit text-[10px] text-white/60 font-medium leading-snug line-clamp-2">
                    {pendingFilm ? `Annonce "${pendingFilm.titre}"` : "Annonce ton prochain film."}
                  </p>
                </div>
              </div>
            </div>

            {/* Avis Express */}
            <div
              onClick={() => onSelectTool('share')}
              className="snap-start shrink-0 relative w-[160px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group shadow-xl border border-white/10 bg-[#050505]"
            >
              {avisBgImage ? (
                <>
                  <img src={avisBgImage} className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-110 saturate-[0.8]" alt="" crossOrigin="anonymous"/>
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/50 to-black/20 group-hover:via-black/60 transition-colors"/>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)' }}/>
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 to-transparent"/>
                </>
              )}
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 group-active:scale-95 transition-transform">
                <div className="w-8 h-8 rounded-full bg-black/50 border border-white/15 backdrop-blur-md flex items-center justify-center self-end group-hover:border-[#E8B200]/40 transition-colors">
                  <Star size={16} className="text-white/70 group-hover:text-[#E8B200] transition-colors" strokeWidth={1.5}/>
                </div>
                <div>
                  <h3 className="font-galinoy italic text-xl text-white leading-tight mb-1">Avis<br/>Express</h3>
                  <p className="font-outfit text-[10px] text-white/60 font-medium leading-snug line-clamp-2">
                    {latestRatedFilm ? `Sur "${latestRatedFilm.titre}"` : "Partage ta critique à chaud."}
                  </p>
                </div>
              </div>
            </div>

            {/* Top 10 Annuel — coming soon */}
            <div className="snap-start shrink-0 relative w-[160px] aspect-[9/16] rounded-2xl overflow-hidden shadow-xl border border-white/5 bg-[#0C0C0E] flex flex-col mr-6">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)' }}/>
              <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center self-end">
                  <Sparkles size={15} className="text-white/60" strokeWidth={1.5}/>
                </div>
                <div>
                  <h3 className="font-galinoy italic text-xl text-white leading-tight mb-1">Top 10<br/>Annuel</h3>
                  <p className="font-outfit text-[10px] text-white/50 font-medium leading-snug">Le classement ultime.</p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="bg-[#E8B200] text-black font-outfit font-black text-[9px] uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full transform -rotate-12 shadow-[0_4px_12px_rgba(232,178,0,0.3)]">
                  Bientôt
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}