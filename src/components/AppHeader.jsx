import { createElement, useState, useEffect, useRef } from 'react';
import { Clapperboard, Clock3, House, UserRound } from 'lucide-react';

const COLLAPSE_AT = 48;
const REVEAL_PX = 24;
const TOP_SNAP = 2;

const LOGO_ROW_H = 52;
const TITLE_ROW_H = 44;
const TAIL_H = 24;

const TABS = [
  { id: 'home', label: 'Accueil', Icon: House },
  { id: 'history', label: 'Journal', Icon: Clock3 },
  { id: 'studio', label: 'Atelier', Icon: Clapperboard },
  { id: 'profile', label: 'Profil', Icon: UserRound },
];

export function AppHeader({
  activeTab,
  setActiveTab,
  scrollY,
  headerTitle,
  headerRight,
  accentColor = '#E8B200',
}) {
  const [expanded, setExpanded] = useState(true);
  const prevScrollY = useRef(0);
  const upAccum = useRef(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const delta = scrollY - prevScrollY.current;
      prevScrollY.current = scrollY;
      if (scrollY <= TOP_SNAP) {
        setExpanded(true);
        upAccum.current = 0;
        return;
      }
      if (delta > 0 && scrollY > COLLAPSE_AT) {
        upAccum.current = 0;
        setExpanded(false);
      } else if (delta < 0) {
        upAccum.current += Math.abs(delta);
        if (upAccum.current >= REVEAL_PX) {
          setExpanded(true);
          upAccum.current = 0;
        }
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollY]);

  const desktopContentHeight = (expanded ? LOGO_ROW_H : 0) + TITLE_ROW_H;
  const desktopTotalHeight = desktopContentHeight + TAIL_H;
  const cssVars = `
    :root {
      --header-opaque-height: calc(env(safe-area-inset-top, 0px) + ${desktopContentHeight}px);
      --header-total-height: calc(env(safe-area-inset-top, 0px) + ${desktopTotalHeight}px);
    }
    @media (max-width: 767px) {
      :root {
        --header-opaque-height: calc(env(safe-area-inset-top, 0px) + 64px);
        --header-total-height: calc(env(safe-area-inset-top, 0px) + 76px);
      }
      #main-scroll-container {
        padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
      }
    }
  `;

  const textPrimary = 'var(--theme-text, #fff)';
  const textMuted = 'color-mix(in srgb, var(--theme-text, #fff) 72%, transparent)';

  return (
    <>
      <style>{cssVars}</style>

      {/* Mobile: quiet page title above a persistent bottom tab bar. */}
      <>
        <header
          className="fixed inset-x-0 top-0 z-[100] overflow-visible md:hidden"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            color: textPrimary,
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, color-mix(in srgb, var(--theme-bg, #111) 70%, transparent) 0%, color-mix(in srgb, var(--theme-bg, #111) 38%, transparent) 55%, transparent 100%)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backdropFilter: 'blur(22px) saturate(145%)',
              WebkitBackdropFilter: 'blur(22px) saturate(145%)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,.7) 0%, rgba(0,0,0,.42) 55%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,.7) 0%, rgba(0,0,0,.42) 55%, transparent 100%)',
            }}
          />
          <div className="relative z-[1] flex h-16 items-center gap-3 px-5">
            <h1 className="font-galinoy italic min-w-0 flex-1 truncate text-[26px] leading-none">
              {headerTitle}
            </h1>
            {headerRight && (
              <div className="flex shrink-0 items-center gap-2">{headerRight}</div>
            )}
          </div>
        </header>

        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] px-4 md:hidden"
          style={{ bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        >
          <nav
            aria-label="Navigation principale"
            className="relative mx-auto grid h-[62px] w-full max-w-[360px] grid-cols-4 overflow-hidden rounded-full border px-2 shadow-[0_12px_36px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.22)] pointer-events-auto"
            style={{
              background: 'color-mix(in srgb, var(--theme-surface, var(--theme-bg, #111)) 42%, transparent)',
              borderColor: 'color-mix(in srgb, var(--theme-text, #fff) 16%, transparent)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,.16), transparent 42%, rgba(255,255,255,.035))',
              }}
            />
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveTab(id)}
                  className="relative z-[1] flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-full px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    color: isActive ? accentColor : textMuted,
                    '--tw-ring-color': accentColor,
                  }}
                >
                  {createElement(Icon, { size: 18, strokeWidth: isActive ? 2.2 : 1.7, 'aria-hidden': true })}
                  <span className="font-outfit text-[10px] font-semibold leading-none tracking-[0.01em]">
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </>

      {/* Tablet and desktop: retain the editorial masthead with inline navigation. */}
      <div
        className="fixed left-0 right-0 top-0 z-[100] hidden md:block"
        style={{
          height: `calc(env(safe-area-inset-top, 0px) + ${desktopTotalHeight}px)`,
          pointerEvents: 'none',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, color-mix(in srgb, var(--theme-bg, #111) 70%, transparent) 0%, color-mix(in srgb, var(--theme-bg, #111) 38%, transparent) 55%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backdropFilter: 'blur(22px) saturate(145%)',
            WebkitBackdropFilter: 'blur(22px) saturate(145%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,.7) 0%, rgba(0,0,0,.42) 55%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,.7) 0%, rgba(0,0,0,.42) 55%, transparent 100%)',
          }}
        />
        <div className="absolute inset-x-0 top-0" style={{ pointerEvents: 'auto' }}>
          <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />

          <div
            style={{
              height: expanded ? `${LOGO_ROW_H}px` : '0px',
              overflow: 'hidden',
              opacity: expanded ? 1 : 0,
              transition: 'height 300ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease',
            }}
          >
            <div className="relative flex h-full items-center px-8">
              <p className="m-0 shrink-0 font-outfit text-[9px] font-extrabold uppercase leading-[1.35] tracking-[0.2em] text-[var(--theme-text)] opacity-45">
                Grand<br />Écran
              </p>

              <nav aria-label="Navigation principale" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-4">
                {TABS.map(({ id, label }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => setActiveTab(id)}
                      className="relative flex min-h-11 items-center justify-center rounded-md px-2 text-[11px] font-bold tracking-[0.07em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isActive ? textPrimary : textMuted,
                        '--tw-ring-color': accentColor,
                      }}
                    >
                      {label}
                      {isActive && <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" style={{ background: accentColor }} />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-visible px-8" style={{ height: `${TITLE_ROW_H}px` }}>
            <h1 className="font-galinoy italic min-w-0 flex-1 truncate text-[32px] leading-[1.15] tracking-[-0.01em]" style={{ color: textPrimary, margin: 0 }}>
              {headerTitle}
            </h1>
            {headerRight && <div className="flex shrink-0 items-center gap-2">{headerRight}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
