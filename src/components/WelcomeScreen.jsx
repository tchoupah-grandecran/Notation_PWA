import { useState, useEffect } from 'react';
import { THEME_COLORS, THEME_TOKENS } from '../constants';

/* ─── Icons ───────────────────────────────────────────────────────── */
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/* ─── Data ────────────────────────────────────────────────────────── */
const TITLES = [
  'Mulholland Drive', 'Tokyo Story', 'La Dolce Vita', 'Vertigo',
  'Stalker', 'In the Mood for Love', 'Mirror', 'Au hasard Balthazar',
  'Persona', "L'Avventura", 'Breathless', 'Hiroshima Mon Amour',
  'Andrei Rublev', '8½', 'The Conformist', 'Ordet',
];

const AUTH_MODES = [
  { id: 'signin', label: 'Se connecter' },
  { id: 'signup', label: 'Créer un compte' },
];

const PLATFORMS = [
  { id: 'ios',     label: 'iPhone' },
  { id: 'android', label: 'Android' },
];

const Svg = ({ children, fill = 'none' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

/* Icônes identiques à celles que l'on voit dans le navigateur */
const SafariIcon  = () => <Svg><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></Svg>;
const ChromeIcon  = () => <Svg><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.4" /><path d="M12 8.6h7.6M9.1 13.7L5.3 7M14.9 13.7L11.1 20.4" /></Svg>;
const ShareIcon   = () => <Svg><path d="M12 3v12M8 7l4-4 4 4M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16" /></Svg>;
const AddHomeIcon = () => <Svg><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M12 8v8M8 12h8" /></Svg>;
const DotsIcon    = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="12" cy="19" r="1.9" />
  </svg>
);
const InstallIcon = () => <Svg><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M12 7.5v6M9.5 11.5l2.5 2.5 2.5-2.5" /></Svg>;

/* tile = ce que la personne doit chercher à l'écran */
const INSTALL_STEPS = {
  ios: [
    { tile: <SafariIcon />,  label: 'Ouvrez dans Safari' },
    { tile: <ShareIcon />,   label: 'Touchez Partager', hint: 'Barre du bas' },
    { tile: <AddHomeIcon />, label: 'Sur l’écran d’accueil', hint: 'Faites défiler la liste' },
    { tile: 'Ajouter', tileColor: '#0A84FF', label: 'Touchez Ajouter' },
  ],
  android: [
    { tile: <ChromeIcon />,  label: 'Ouvrez dans Chrome' },
    { tile: <DotsIcon />,    label: 'Touchez le menu', hint: 'En haut à droite' },
    { tile: <InstallIcon />, label: 'Installer l’application', hint: 'ou « Ajouter à l’écran d’accueil »' },
    { tile: 'Installer', tileColor: '#1A73E8', label: 'Confirmez' },
  ],
};

const detectPlatform = () =>
  typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent) ? 'android' : 'ios';

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

/* ─── Segmented control ───────────────────────────────────────────── */
function Segmented({ options, value, onChange, color, label, padding = '0.75rem 0.5rem' }) {
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  const width = `calc(${100 / options.length}% - 4px)`;

  return (
    <div
      role="tablist"
      aria-label={label}
      className="relative grid p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
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
          width,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.09)',
          transform: `translateX(${index * 100}%)`,
          transition: 'transform 0.4s cubic-bezier(.3,.7,.2,1)',
        }}
      />
      {options.map(({ id, label: text }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className="ge-focus relative"
          style={{
            padding,
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: 999,
            color,
            opacity: value === id ? 1 : 0.45,
            transition: 'opacity 0.3s ease',
          }}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/* ─── Install sheet ───────────────────────────────────────────────── */
function InstallSheet({ onClose, DARK }) {
  const [platform, setPlatform] = useState(detectPlatform);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ge-install-title"
    >
      <div
        className="ge-fade absolute inset-0"
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      />

      <div
        className="ge-sheet relative w-full overflow-y-auto"
        style={{
          maxWidth: 440,
          maxHeight: '88dvh',
          background: `color-mix(in srgb, ${DARK.text} 7%, ${DARK.bg})`,
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          borderRadius: '24px 24px 0 0',
          padding: '1.25rem 1.5rem calc(1.75rem + env(safe-area-inset-bottom, 0px))',
          color: DARK.text,
        }}
      >
        <div className="flex items-center justify-between gap-4" style={{ marginBottom: '1.25rem' }}>
          <h2 id="ge-install-title" className="font-galinoy italic" style={{ fontSize: '1.6rem', lineHeight: 1.1 }}>
            Ajouter à l’écran d’accueil
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            autoFocus
            className="ge-focus flex items-center justify-center flex-shrink-0"
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', color: DARK.text }}
          >
            <CloseIcon />
          </button>
        </div>

        <Segmented
          options={PLATFORMS}
          value={platform}
          onChange={setPlatform}
          color={DARK.text}
          label="Système du téléphone"
          padding="0.6rem 0.5rem"
        />

        <ol key={platform} className="ge-swap flex flex-col" style={{ gap: '0.65rem', marginTop: '1.25rem', listStyle: 'none', padding: 0 }}>
          {INSTALL_STEPS[platform].map((step, i) => (
            <li
              key={step.label}
              className="flex items-center gap-4"
              style={{ padding: '0.6rem 0.75rem 0.6rem 0.6rem', background: 'rgba(255,255,255,0.04)', borderRadius: 16 }}
            >
              {/* Reproduction de l'élément à toucher */}
              <span
                aria-hidden="true"
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  minWidth: 52,
                  height: 46,
                  padding: typeof step.tile === 'string' ? '0 0.9rem' : 0,
                  borderRadius: 12,
                  background: '#F2F2F5',
                  color: step.tileColor || '#1C1C1E',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {step.tile}
              </span>
              <div className="flex-1" style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3 }}>{step.label}</p>
                {step.hint && (
                  <p style={{ fontSize: '0.75rem', lineHeight: 1.4, opacity: 0.45, marginTop: 2 }}>{step.hint}</p>
                )}
              </div>
              <span aria-label={`Étape ${i + 1}`} style={{ fontSize: '0.8rem', fontWeight: 600, color: DARK.accent, opacity: 0.9 }}>
                {i + 1}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ─── WelcomeScreen ───────────────────────────────────────────────── */
export function WelcomeScreen({ login, isAuthenticating, error }) {
  const savedName   = localStorage.getItem('grandecran_username') || '';
  const isReturning = !!savedName;
  const [mode, setMode]               = useState(isReturning ? 'signin' : 'signup');
  const [showInstall, setShowInstall] = useState(false);

  const DARK     = THEME_COLORS.dark;
  const tokens   = THEME_TOKENS('dark');
  const isSignup = mode === 'signup';
  const canInstall = !isStandalone();

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: DARK.bg, color: DARK.text, ...tokens }}
    >
      <style>{`
        @keyframes ge-rise    { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ge-breathe { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: .85; transform: scale(1.08); } }
        @keyframes ge-swap    { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ge-fade    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ge-sheet   { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .ge-rise  { opacity: 0; animation: ge-rise 0.9s cubic-bezier(.2,.7,.2,1) forwards; }
        .ge-swap  { animation: ge-swap 0.35s ease both; }
        .ge-glow  { animation: ge-breathe 9s ease-in-out infinite; }
        .ge-fade  { animation: ge-fade 0.3s ease both; }
        .ge-sheet { animation: ge-sheet 0.45s cubic-bezier(.2,.8,.2,1) both; }
        .ge-focus:focus-visible { outline: 2px solid ${DARK.accent}; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .ge-rise, .ge-swap, .ge-glow, .ge-fade, .ge-sheet { animation: none; opacity: 1; transform: none; }
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
          top: '-22%',
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

      {/* Content — flows from the top */}
      <div
        className="relative z-10 flex flex-col flex-1 overflow-y-auto px-8"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2.5rem)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Brand */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            className="ge-rise font-galinoy italic leading-none"
            style={{
              fontSize: 'clamp(3.5rem, 16vw, 5.5rem)',
              letterSpacing: '-0.02em',
              marginBottom: '1.25rem',
              animationDelay: '0.1s',
            }}
          >
            Grand<br />Écran
          </h1>
          <div
            className="ge-rise"
            style={{ width: '2.5rem', height: 2, background: DARK.accent, marginBottom: '1rem', animationDelay: '0.3s' }}
          />
          <p
            className="ge-rise"
            style={{ animationDelay: '0.45s', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '28ch', opacity: 0 }}
          >
            <span style={{ opacity: 0.5 }}>Consignez, évaluez et racontez votre histoire avec le cinéma.</span>
          </p>
        </div>

        {/* Auth */}
        <div className="ge-rise flex flex-col gap-5" style={{ animationDelay: '0.65s' }}>
          <Segmented
            options={AUTH_MODES}
            value={mode}
            onChange={setMode}
            color={DARK.text}
            label="Mode de connexion"
          />

          <p
            key={mode}
            className="ge-swap"
            style={{ fontSize: '0.85rem', lineHeight: 1.6, opacity: 0.55, minHeight: '2.7em' }}
          >
            {isSignup
              ? 'Votre compte Google suffit : votre journal est prêt en quelques secondes.'
              : isReturning
                ? <>Heureux de vous retrouver, <strong style={{ fontWeight: 600 }}>{savedName}</strong>.</>
                : 'Retrouvez votre journal là où vous l’avez laissé.'}
          </p>

          <button
            type="button"
            onClick={() => login()}
            disabled={isAuthenticating}
            className="ge-focus flex items-center justify-center gap-3 w-full active:scale-[0.985]"
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

          <p style={{ fontSize: '0.75rem', lineHeight: 1.6, opacity: 0.38, textAlign: 'center' }}>
            Seuls les comptes Google sont acceptés.
            <br />
            Aucun mot de passe à créer ni à retenir.
          </p>

          {canInstall && (
            <button
              type="button"
              onClick={() => setShowInstall(true)}
              className="ge-focus flex items-center justify-center gap-2 self-center"
              style={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: DARK.text,
                opacity: 0.7,
                padding: '0.5rem 0.75rem',
                borderRadius: 999,
              }}
            >
              <PhoneIcon />
              <span style={{ borderBottom: '1px solid rgba(255,255,255,0.25)', paddingBottom: 1 }}>
                Installer sur mon téléphone
              </span>
            </button>
          )}
        </div>

        {/* Footer */}
        <p
          className="ge-rise italic mt-auto text-center"
          style={{ fontSize: '0.75rem', lineHeight: 1.6, paddingTop: '2.5rem', paddingBottom: '2rem', animationDelay: '0.9s' }}
        >
          <span style={{ opacity: 0.22 }}>« Le cinéma, c’est vingt-quatre fois la vérité par seconde. »</span>
        </p>
      </div>

      {showInstall && <InstallSheet onClose={() => setShowInstall(false)} DARK={DARK} />}
    </div>
  );
}

export default WelcomeScreen;