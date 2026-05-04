import { useEffect, useRef } from 'react';

/**
 * AppHeader — Fixed top header for Grand Écran
 *
 * Props:
 *   title      : string       — displayed in galinoy italic
 *   subtitle   : string?      — small muted uppercase label (e.g. current month)
 *   scrolled   : boolean      — triggers compact / frosted mode
 *   leftSlot   : ReactNode?   — back button, etc.
 *   rightSlot  : ReactNode?   — search / filter / scan buttons
 */
export function AppHeader({
  title = '',
  subtitle,
  scrolled = false,
  leftSlot,
  rightSlot,
}) {
  // We animate the title font-size via a CSS custom property driven by a
  // data-attribute so we never swap DOM nodes (avoids layout shift).
  const titleRef = useRef(null);

  return (
    <header
      data-scrolled={scrolled}
      className="app-header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        // Safe-area padding applied via CSS below
      }}
    >
      {/*
        ── INNER WRAPPER ────────────────────────────────────────────────────
        Handles safe-area, backdrop, border transition.
      */}
      <div className="app-header__inner">

        {/* LEFT SLOT */}
        <div className="app-header__slot app-header__slot--left">
          {leftSlot ?? <div className="app-header__slot-placeholder" />}
        </div>

        {/* TITLE BLOCK */}
        <div className="app-header__title-block" aria-live="polite">
          <h1
            ref={titleRef}
            className="app-header__title font-galinoy"
          >
            {title}
          </h1>
          {/*
            Subtitle fades in when provided.
            Used by History to show the current visible month.
          */}
          <p
            className="app-header__subtitle font-outfit"
            aria-hidden={!subtitle}
            data-visible={!!subtitle}
          >
            {subtitle ?? ''}
          </p>
        </div>

        {/* RIGHT SLOT */}
        <div className="app-header__slot app-header__slot--right">
          {rightSlot}
        </div>
      </div>

      {/* ── SCOPED STYLES ──────────────────────────────────────────────── */}
      <style>{`

        /* ── Base ─────────────────────────────────────────────────────── */
        .app-header {
          /* Nothing interactive outside the inner wrapper */
          pointer-events: none;
        }

        .app-header__inner {
          pointer-events: all;

          display: flex;
          align-items: flex-end;          /* bottom-align so title sits on a baseline */
          gap: 0.75rem;

          /* Safe-area padding: top comes from the device notch,
             sides get a little breathing room */
          padding-top:    calc(env(safe-area-inset-top) + 0.75rem);
          padding-bottom: 0.875rem;
          padding-left:   calc(env(safe-area-inset-left)  + 1.25rem);
          padding-right:  calc(env(safe-area-inset-right) + 1.25rem);

          /* Transitions ------------------------------------------------- */
          /* background-color and backdrop-filter animate together */
          transition:
            background-color 400ms cubic-bezier(0.4, 0, 0.2, 1),
            border-color     400ms cubic-bezier(0.4, 0, 0.2, 1),
            backdrop-filter  400ms cubic-bezier(0.4, 0, 0.2, 1),
            -webkit-backdrop-filter 400ms cubic-bezier(0.4, 0, 0.2, 1),
            padding-bottom   400ms cubic-bezier(0.4, 0, 0.2, 1);

          /* Default (not scrolled): transparent, no border */
          background-color: transparent;
          border-bottom: 1px solid transparent;
        }

        /* ── Scrolled (compact / frosted) ─────────────────────────────── */
        .app-header[data-scrolled="true"] .app-header__inner {
          background-color: color-mix(
            in srgb,
            var(--theme-bg, #0A0A0A) 92%,
            transparent
          );
          -webkit-backdrop-filter: blur(24px) saturate(1.6);
          backdrop-filter:         blur(24px) saturate(1.6);
          border-bottom-color: var(--theme-border, rgba(255,255,255,0.08));
          padding-bottom: 0.625rem;
        }

        /* ── Slots ────────────────────────────────────────────────────── */
        .app-header__slot {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          /* Keep slots from collapsing when empty */
          min-width: 2.75rem;   /* 44px — minimum tap target width */
          min-height: 2.75rem;
        }

        .app-header__slot--left {
          justify-content: flex-start;
        }

        .app-header__slot--right {
          justify-content: flex-end;
          gap: 0.5rem;
        }

        /* Invisible placeholder so title stays centred even with no leftSlot */
        .app-header__slot-placeholder {
          width:  2.75rem;
          height: 2.75rem;
        }

        /* ── Title block ──────────────────────────────────────────────── */
        .app-header__title-block {
          flex: 1;
          min-width: 0;           /* allow text truncation */
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow: hidden;
        }

        /* ── Title ────────────────────────────────────────────────────── */
        .app-header__title {
          margin: 0;
          padding: 0;
          line-height: 0.9;
          font-style: italic;
          color: var(--theme-text, #F0EAD6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          /* THE key trick: font-size transitions on a single element.
             We drive it with a CSS custom property so both states
             are declared here and the browser interpolates smoothly. */
          font-size: var(--app-header-title-size, 3.5rem); /* ~text-6xl equivalent */
          transition: font-size 380ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Override the CSS var when scrolled */
        .app-header[data-scrolled="true"] .app-header__title {
          --app-header-title-size: 1.375rem; /* ~text-2xl */
          line-height: 1.2;
        }

        /* ── Subtitle ─────────────────────────────────────────────────── */
        .app-header__subtitle {
          margin: 0;
          padding: 0;
          font-size: 0.625rem;         /* 10px */
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--theme-text, #F0EAD6);

          /* Show/hide with opacity + max-height so it doesn't pop */
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition:
            opacity    300ms cubic-bezier(0.4, 0, 0.2, 1) 60ms,
            max-height 300ms cubic-bezier(0.4, 0, 0.2, 1) 60ms;
        }

        /* Visible when subtitle text is present */
        .app-header__subtitle[data-visible="true"] {
          opacity: 0.4;
          max-height: 1.5rem;
          margin-top: 0.125rem;
        }

        /* In compact mode, subtitle gets a little more breathing room */
        .app-header[data-scrolled="true"] .app-header__subtitle[data-visible="true"] {
          opacity: 0.5;
        }

      `}</style>
    </header>
  );
}