import { useState, useEffect, useRef } from 'react';

/**
 * AppHeader — gradient + blur progressif, GRAND/ÉCRAN sur 2 lignes
 *
 * Fond : linear-gradient(theme-bg 90% → transparent 100%)
 * Blur : 20px en haut → 0px en bas (5 tranches superposées)
 * Texte : blanc avec text-shadow léger
 *
 * EXPANDED :
 *   [safe-area]
 *   [GRAND/ÉCRAN  |  tabs centrés  |  spacer]   52px
 *   [titre        |  actions]                    44px
 *   [tail gradient]                              32px
 *
 * COLLAPSED :
 *   [safe-area]
 *   [titre        |  actions]                    44px
 *   [tail gradient]                              32px
 *
 * CSS vars :
 *   --header-opaque-height   = safe-area + logo-row + title-row
 *   --header-total-height    = --header-opaque-height + tail
 */

const COLLAPSE_AT = 48;
const REVEAL_PX   = 2;
const TOP_SNAP    = 2;

const LOGO_ROW_H  = 52;
const TITLE_ROW_H = 44;
const TAIL_H      = 32;

const TABS = [
  { id: 'home',    label: 'Accueil' },
  { id: 'history', label: 'Journal' },
  { id: 'studio',  label: 'Atelier' },
  { id: 'profile', label: 'Profil'  },
];

// Tranches de blur progressif : index 0 = haut (fort), dernier = bas (faible)
const BLUR_LAYERS = [
  { blur: 20, topPct: 0,   bottomPct: 100 },
  { blur: 14, topPct: 0,   bottomPct: 80  },
  { blur: 9,  topPct: 0,   bottomPct: 60  },
  { blur: 4,  topPct: 0,   bottomPct: 40  },
  { blur: 1,  topPct: 0,   bottomPct: 22  },
];

export function AppHeader({
  activeTab,
  setActiveTab,
  scrollY,
  headerTitle,
  headerRight,
  isDark,
  accentColor = '#E8B200',
}) {
  const [expanded, setExpanded] = useState(true);
  const prevScrollY = useRef(0);
  const upAccum     = useRef(0);

  useEffect(() => {
    const delta = scrollY - prevScrollY.current;
    prevScrollY.current = scrollY;
    if (scrollY <= TOP_SNAP) { setExpanded(true); upAccum.current = 0; return; }
    if (delta > 0 && scrollY > COLLAPSE_AT) { upAccum.current = 0; setExpanded(false); }
    else if (delta < 0) {
      upAccum.current += Math.abs(delta);
      if (upAccum.current >= REVEAL_PX) setExpanded(true);
    }
  }, [scrollY]);

  const belowSafe = expanded ? LOGO_ROW_H + TITLE_ROW_H : TITLE_ROW_H;
  const totalH    = belowSafe + TAIL_H;

  const cssVars = `
    :root {
      --header-opaque-height: calc(env(safe-area-inset-top, 0px) + ${belowSafe}px);
      --header-total-height:  calc(env(safe-area-inset-top, 0px) + ${totalH}px);
    }
  `;

  const textPrimary = 'rgba(255,255,255,0.95)';
  const textMuted   = 'rgba(255,255,255,0.38)';
  const shadow      = '0 1px 8px rgba(0,0,0,0.4)';

  return (
    <>
      <style>{cssVars}</style>

      <div
        className="fixed top-0 left-0 right-0 z-[200]"
        style={{
          height: `calc(env(safe-area-inset-top, 0px) + ${totalH}px)`,
          pointerEvents: 'none',
        }}
      >

        {/* ── COUCHE 1 : Blur progressif (5 tranches superposées) ─────── */}
        {BLUR_LAYERS.map(({ blur, bottomPct }, i) => (
          <div
            key={i}
            className="absolute inset-x-0 top-0"
            style={{
              height: `${bottomPct}%`,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              // Masque : opaque en haut, fondu sur les 40% bas de chaque tranche
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
              maskImage:        'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* ── COUCHE 2 : Gradient de fond ─────────────────────────────── */}
        {/*
         * Utilise color-mix pour opacifier theme-bg.
         * Fallback : si color-mix non supporté, on utilise une pseudo-variable.
         * On préfère une approche plus compatible : on superpose un div coloré
         * avec opacité décroissante.
         */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, var(--theme-bg) 0%, var(--theme-bg) 30%, transparent 100%)',
            opacity: 0.88,
            pointerEvents: 'none',
          }}
        />

        {/* ── COUCHE 3 : Contenu (pointerEvents actifs) ───────────────── */}
        <div
          className="absolute inset-x-0 top-0"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Safe area spacer */}
          <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />

          {/* ── Logo row : GRAND / ÉCRAN + tabs ── */}
          <div
            style={{
              height: expanded ? `${LOGO_ROW_H}px` : '0px',
              overflow: 'hidden',
              opacity: expanded ? 1 : 0,
              transition: 'height 300ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease',
            }}
          >
            <div className="relative flex items-center h-full px-5">

              {/* GRAND\nÉCRAN */}
              <div style={{ flexShrink: 0 }}>
                <p style={{
                  fontFamily: 'var(--font-outfit, "Outfit", sans-serif)',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: textPrimary,
                  opacity: 0.45,
                  lineHeight: 1.35,
                  textShadow: shadow,
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}>
                  Grand<br />Écran
                </p>
              </div>

              {/* Tabs centrés (position absolue pour ne pas pousser le logo) */}
              <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-5">
                {TABS.map(({ id, label }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className="relative outline-none"
                      style={{
                        background: 'none', border: 'none',
                        padding: '4px 0', cursor: 'pointer',
                        fontSize: '11px', fontWeight: 700,
                        letterSpacing: '0.07em',
                        color: isActive ? textPrimary : textMuted,
                        transition: 'color 200ms',
                        textShadow: shadow,
                      }}
                    >
                      {label}
                      {isActive && (
                        <span
                          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full"
                          style={{ width: 4, height: 4, background: accentColor, display: 'block' }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Spacer droit pour équilibrer le logo gauche */}
              <div style={{ marginLeft: 'auto', width: '3.5rem', flexShrink: 0 }} />
            </div>
          </div>

          {/* ── Title row ── */}
          <div
            className="flex items-center gap-3 px-5"
            style={{ height: `${TITLE_ROW_H}px` }}
          >
            <h1
              className="font-galinoy italic leading-none flex-1 min-w-0 truncate"
              style={{
                fontSize: 'clamp(1.5rem, 7vw, 2rem)',
                color: textPrimary,
                letterSpacing: '-0.01em',
                margin: 0,
                textShadow: shadow,
              }}
            >
              {headerTitle}
            </h1>

            <div className="flex items-center gap-2 flex-shrink-0">
              {headerRight}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}