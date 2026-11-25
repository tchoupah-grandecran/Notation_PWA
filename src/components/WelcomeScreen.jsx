import { useState } from 'react';
import { THEME_COLORS, THEME_TOKENS } from '../constants';

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const TITLES = [
  'Mulholland Drive', 'Tokyo Story', 'La Dolce Vita', 'Vertigo',
  'Stalker', 'In the Mood for Love', 'Mirror', 'Au hasard Balthazar',
  'Persona', "L'Avventura", 'Breathless', 'Hiroshima Mon Amour',
  'Andrei Rublev', '8½', 'The Conformist', 'Ordet',
];

const MODES = [
  { id: 'signin', label: 'Se connecter' },
  { id: 'signup', label: 'Créer un compte' },
];

export function WelcomeScreen({ login, isAuthenticating, error }) {
  const savedName   = localStorage.getItem('grandecran_username') || '';
  const isReturning = !!savedName;
  const [mode, setMode] = useState(isReturning ? 'signin' : 'signup');

  const DARK   = THEME_COLORS.dark;
  const tokens = THEME_TOKENS('dark');
  const isSignup = mode === 'signup';

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: DARK.bg, color: DARK.text, ...tokens }}
    >
      <style>{`
        @keyframes ge-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ge-breathe {
          0%, 100% { opacity: .55; transform: scale(1); }
          50%      { opacity: .85; transform: scale(1.08); }
        }
        @keyframes ge-swap {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ge-rise  { opacity: 0; animation: ge-rise 0.9s cubic-bezier(.2,.7,.2,1) forwards; }
        .ge-swap  { animation: ge-swap 0.35s ease both; }
        .ge-glow  { animation: ge-breathe 9s ease-in-out infinite; }
        .ge-seg:focus-visible, .ge-cta:focus-visible {
          outline: 2px solid ${DARK.accent};
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .ge-rise, .ge-swap, .ge-glow { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      {/* Grain */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999] h-full w-full"
        style={{
          backgroundImage: 'var(--theme-grain-url)',
          opacity: 'var(--theme-grain-opacity)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Soft accent light */}
      <div
        className="ge-glow absolute pointer-events-none"
        aria-hidden="true"
        style={{
          top: '-18%',
          left: '-25%',
          width: '120vw',
          height: '120vw',
          maxWidth: 720,
          maxHeight: 720,
          borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in srgb, ${DARK.accent} 16%, transparent) 0%, transparent 65%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Faint film titles */}
      <div
        className="absolute inset-0 flex gap-8 px-6 overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
      >
        <div className="flex flex-col gap-5 pt-24" style={{ opacity: 0.05 }}>
          {TITLES.slice(0, 8).map((t) => (
            <span key={t} className="text-xs tracking-[0.2em] whitespace-nowrap" style={{ color: DARK.text }}>{t}</span>
          ))}
        </div>
        <div className="flex flex-col gap-5 pt-48 ml-auto" style={{ opacity: 0.035 }}>
          {TITLES.slice(8).map((t) => (
            <span key={t} className="text-xs tracking-[0.2em] whitespace-nowrap" style={{ color: DARK.text }}>{t}</span>
          ))}
        </div>
      </div>

      <div
        className="relative z-10 flex flex-col flex-1 overflow-y-auto"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Title block */}
        <div className="flex-1 flex flex-col justify-end px-8 pt-16 pb-10">
          <h1
            className="ge-rise font-galinoy italic leading-none"
            style={{
              fontSize: 'clamp(4rem, 18vw, 6.5rem)',
              letterSpacing: '-0.02em',
              marginBottom: '1.5rem',
              animationDelay: '0.1s',
            }}
          >
            Grand<br />Écran
          </h1>
          <div
            className="ge-rise"
            style={{ width: '2.5rem', height: 2, background: DARK.accent, marginBottom: '1.25rem', animationDelay: '0.3s' }}
          />
          <p
            className="ge-rise"
            style={{ opacity: 0, animationDelay: '0.45s', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '28ch', color: DARK.text }}
          >
            <span style={{ opacity: 0.5 }}>Consignez, évaluez et racontez votre histoire avec le cinéma.</span>
          </p>
        </div>

        {/* Auth block */}
        <div className="ge-rise px-8 pb-10 flex flex-col gap-5" style={{ animationDelay: '0.65s' }}>
          {/* Mode switch */}
          <div
            role="tablist"
            aria-label="Mode de connexion"
            className="relative grid grid-cols-2 p-1"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999,
            }}
          >
            <span
              aria-hidden="true"
              className="absolute"
              style={{
                top: 4,
                bottom: 4,
                left: 4,
                width: 'calc(50% - 4px)',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.09)',
                transform: isSignup ? 'translateX(100%)' : 'translateX(0)',
                transition: 'transform 0.4s cubic-bezier(.3,.7,.2,1)',
              }}
            />
            {MODES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className="ge-seg relative"
                style={{
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: 999,
                  color: DARK.text,
                  opacity: mode === id ? 1 : 0.45,
                  transition: 'opacity 0.3s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Contextual line */}
          <p
            key={mode}
            className="ge-swap"
            style={{ fontSize: '0.85rem', lineHeight: 1.6, color: DARK.text, opacity: 0.55, minHeight: '2.7em' }}
          >
            {isSignup
              ? 'Votre compte Google suffit : votre journal est prêt en quelques secondes.'
              : isReturning
                ? <>Heureux de vous retrouver, <strong style={{ fontWeight: 600, color: DARK.text }}>{savedName}</strong>.</>
                : 'Retrouvez votre journal là où vous l’avez laissé.'}
          </p>

          {/* CTA */}
          <button
            type="button"
            onClick={() => login()}
            disabled={isAuthenticating}
            className="ge-cta flex items-center justify-center gap-3 w-full active:scale-[0.985]"
            style={{
              background: DARK.text,
              color: DARK.bg,
              padding: '1rem 1.5rem',
              borderRadius: 999,
              fontSize: '0.95rem',
              fontWeight: 600,
              opacity: isAuthenticating ? 0.6 : 1,
              transition: 'opacity 0.2s ease, transform 0.15s ease',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#fff',
              }}
            >
              <GoogleLogo />
            </span>
            <span>
              {isAuthenticating
                ? 'Connexion…'
                : isSignup
                  ? 'Créer un compte avec Google'
                  : 'Se connecter avec Google'}
            </span>
          </button>

          {error && (
            <p role="alert" style={{ color: '#f0a39a', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          <p style={{ fontSize: '0.75rem', lineHeight: 1.6, color: DARK.text, opacity: 0.38, textAlign: 'center' }}>
            Seuls les comptes Google sont acceptés.
            <br />
            Aucun mot de passe à créer ni à retenir.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;