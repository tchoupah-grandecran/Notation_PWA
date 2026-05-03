import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PendingRatingToast = ({ film, onOpen, count = 1 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef(null);

  // Function to handle automatic closing
  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 3000);
  };

  useEffect(() => {
    if (film) {
      setIsExpanded(true);
      startTimer();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [film, count]);

  if (!film) return null;

  const posterUrl = film.affiche 
    ? (import.meta.env.DEV ? `/tmdb-proxy?url=${encodeURIComponent(film.affiche)}` : `/api/proxy-image?url=${encodeURIComponent(film.affiche)}`)
    : null;

  return (
    <div 
      className="fixed right-4 z-40 flex justify-end pointer-events-none"
      style={{ bottom: 'calc(var(--navbar-total-height) + 25px)' }}
    >
      <motion.div
        layout
        initial={false}
        animate={{ 
          width: isExpanded ? 'auto' : '56px',
          height: '56px',
          borderRadius: isExpanded ? '16px' : '28px',
        }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="max-w-[calc(100vw-32px)] md:max-w-md bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-2xl backdrop-blur-xl pointer-events-auto overflow-hidden flex items-center"
      >
        {/* CLOSED STATE: MINIMAL STAR */}
        {!isExpanded && (
          <button 
            onClick={() => {
              setIsExpanded(true);
              startTimer(); // Restart timer if user manually expands
            }}
            className="w-full h-full flex items-center justify-center text-[var(--theme-accent)] active:scale-90 transition-transform"
          >
            <Star size={24} fill="currentColor" className="opacity-90" />
          </button>
        )}

        {/* OPEN STATE: FULL BLEED CONTENT */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div 
              key="expanded-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center w-full h-full"
            >
              {/* Poster: Full Height, Flush Left */}
              <div 
                onClick={onOpen}
                className="w-[42px] h-[56px] bg-[var(--theme-text)]/5 flex-shrink-0 border-r border-[var(--theme-border)] cursor-pointer"
              >
                {posterUrl ? (
                  <img src={posterUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--theme-text)]/20">
                    <Ticket size={16} />
                  </div>
                )}
              </div>

              {/* Info: Centered content */}
              <div className="flex-1 min-w-[120px] px-4 cursor-pointer" onClick={onOpen}>
                <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-[0.15em] leading-none mb-1">
                  À noter
                </p>
                <h4 className="text-sm font-bold text-[var(--theme-text)] truncate leading-tight">
                  {film.titre}
                  {count > 1 && (
                    <span className="ml-2 text-[var(--theme-accent)] text-[10px] font-black opacity-80">
                      +{count - 1}
                    </span>
                  )}
                </h4>
              </div>

              {/* Actions & Manual Close */}
              <div className="flex items-center gap-1 pr-3">
                <button 
                  onClick={onOpen}
                  className="bg-[var(--theme-accent)] text-[var(--theme-bg)] text-[10px] font-black uppercase px-4 py-2 rounded-lg active:scale-95 transition-transform whitespace-nowrap"
                >
                  Noter
                </button>
                
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-1 text-[var(--theme-text)] opacity-20 hover:opacity-100 transition-opacity"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PendingRatingToast;