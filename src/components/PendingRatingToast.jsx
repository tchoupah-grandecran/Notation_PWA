import React, { useState, useEffect, useRef } from 'react';
import { Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EXPANDED_DURATION_MS = 4000;

const PendingRatingToast = ({ film, onOpen, count = 1 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef(null);

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, EXPANDED_DURATION_MS);
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
    ? (import.meta.env.DEV
        ? `/tmdb-proxy?url=${encodeURIComponent(film.affiche)}`
        : `/api/proxy-image?url=${encodeURIComponent(film.affiche)}`)
    : null;

  const BUBBLE_SIZE = 60;

  const handleClick = () => {
    if (isExpanded) {
      onOpen?.();
    } else {
      setIsExpanded(true);
      startTimer();
    }
  };

  return (
    <div
      className="fixed right-4 flex items-center justify-end pointer-events-none"
      style={{
        bottom: 'calc(30px + env(safe-area-inset-bottom, 0px))',
        zIndex: 99999,
      }}
    >
      <motion.div
        layout
        initial={false}
        animate={{ borderRadius: BUBBLE_SIZE / 2 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={handleClick}
        className="flex items-center pointer-events-auto bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-2xl cursor-pointer active:scale-95 transition-transform"
        style={{ height: BUBBLE_SIZE }}
      >
        {/* ── CIRCULAR POSTER BUBBLE (always visible) ── */}
        <div
          className="relative flex-shrink-0"
          style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
        >
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={film.titre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[var(--theme-text)]/10 text-[var(--theme-text)]/30">
                <Ticket size={22} />
              </div>
            )}
          </div>

          {/* Count badge — déborde librement */}
          {count > 1 && (
            <div
              className="absolute -top-1 -right-1 bg-[#E8B200] text-[var(--theme-bg)] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center leading-none shadow"
              style={{ zIndex: 100000 }}
            >
              +{count - 1}
            </div>
          )}
        </div>

        {/* ── EXPANDED PILL CONTENT ── */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="pill-content"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="overflow-hidden flex items-center"
            >
              <div className="flex items-center gap-3 pl-3 pr-4">
                {/* Text block */}
                <div className="min-w-[100px] max-w-[160px]">
                  <p className="text-[9px] font-black text-[var(--theme-accent)] uppercase tracking-[0.15em] leading-none mb-[3px] whitespace-nowrap">
                    {count > 1 ? `${count} séance(s) à noter` : 'À noter'}
                  </p>
                  <h4 className="text-sm font-bold text-[var(--theme-text)] truncate leading-tight">
                    {film.titre}
                  </h4>
                  {film.date && (
                    <p className="text-[10px] text-[var(--theme-text)]/50 truncate leading-tight mt-[2px]">
                      {film.date}
                    </p>
                  )}
                </div>

                {/* CTA button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen?.();
                  }}
                  className="bg-[var(--theme-accent)] text-[var(--theme-bg)] text-[10px] font-black uppercase px-3 py-[6px] rounded-full active:scale-95 transition-transform whitespace-nowrap flex-shrink-0"
                >
                  Noter
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