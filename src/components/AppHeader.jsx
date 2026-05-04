import React from 'react';

export function AppHeader({
  title = '',
  subtitle = '',
  scrolled = false,
  leftSlot,
  rightSlot,
}) {
  // On n'affiche le titre QUE si on a scrollé. 
  // Priorité au subtitle (le mois), sinon le titre principal.
  const displayTitle = subtitle || title;

  return (
    <header className="app-header" data-scrolled={scrolled}>
      <div className="app-header__inner">
        <div className="app-header__left-group">
          {leftSlot && <div className="app-header__slot">{leftSlot}</div>}

          <div className="app-header__content">
            {/* L'opacité du titre dépend entièrement du scroll */}
            <h1 
              key={displayTitle} 
              className={`app-header__title font-galinoy ${scrolled ? 'animate-title opacity-100' : 'opacity-0'}`}
            >
              {displayTitle}
            </h1>
          </div>
        </div>

        <div className="app-header__slot app-header__slot--right">
          {rightSlot}
        </div>
      </div>

      <style>{`
        .app-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 200;
          pointer-events: none;
          --header-pt: calc(env(safe-area-inset-top) + 12px);
          --header-pb: 14px;
          --bg-opacity: 0;
          --blur: 0px;
        }

        .app-header[data-scrolled="true"] {
          --header-pb: 12px;
          --bg-opacity: 0.9;
          --blur: 20px;
        }

        .app-header__inner {
          pointer-events: all;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--header-pt) 20px var(--header-pb) 20px;
          background-color: color-mix(in srgb, var(--theme-bg, #000) calc(var(--bg-opacity) * 100%), transparent);
          -webkit-backdrop-filter: blur(var(--blur));
          backdrop-filter: blur(var(--blur));
          transition: all 300ms ease-in-out;
        }

        .app-header__title {
          margin: 0;
          font-style: italic;
          color: var(--theme-text);
          font-size: 20px;
          transition: opacity 300ms ease-in-out;
        }

        .animate-title {
          animation: titleSlide 400ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        @keyframes titleSlide {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .app-header__slot--right { 
          display: flex; gap: 10px; z-index: 2;
        }
      `}</style>
    </header>
  );
}