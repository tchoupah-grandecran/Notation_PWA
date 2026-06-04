import React, { useRef } from 'react';

const IconHome = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={active ? 2.2 : 1.5}
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-8 9 8v9a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconJournal = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={active ? 2.2 : 1.5}
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="7"  y1="4"  x2="7"  y2="20" />
    <line x1="17" y1="4"  x2="17" y2="20" />
    <line x1="2"  y1="9"  x2="7"  y2="9" />
    <line x1="17" y1="9"  x2="22" y2="9" />
    <line x1="2"  y1="15" x2="7"  y2="15" />
    <line x1="17" y1="15" x2="22" y2="15" />
  </svg>
);

const IconAtelier = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={active ? 2.2 : 1.5}
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="7" />
    <line x1="12" y1="2"  x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2"  y1="12" x2="5"  y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
  </svg>
);

const IconProfil = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={active ? 2.2 : 1.5}
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const TABS = [
  { id: 'home',    label: 'Accueil', Icon: IconHome    },
  { id: 'history', label: 'Journal', Icon: IconJournal },
  { id: 'studio',  label: 'Atelier', Icon: IconAtelier },
  { id: 'profile', label: 'Profil',  Icon: IconProfil  },
];

// Ajout de la prop `isVisible` (par défaut true si non gérée pour le moment)
export function NavBar({ activeTab, setActiveTab, isDark, isVisible = true }) {
  const btnRefs = useRef({});

  const handlePointerDown = (id) => {
    const el = btnRefs.current[id];
    if (el) el.style.transform = 'scale(0.92)';
  };
  const handlePointerUp = (id) => {
    const el = btnRefs.current[id];
    if (el) el.style.transform = 'scale(1)';
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        paddingTop: '32px',
        pointerEvents: 'none',
        // Animation fluide de disparition/apparition de la navbar globale (Scroll-to-hide)
        transform: isVisible ? 'translateY(0)' : 'translateY(120px)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginLeft: '24px', // Un peu plus rétracté des bords pour l'effet "dock" flottant
          marginRight: '24px',
          height: '56px',
          background: isDark
            ? 'rgba(18, 18, 18, 0.65)'
            : 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px) saturate(190%)',
          WebkitBackdropFilter: 'blur(20px) saturate(190%)',
          borderRadius: '24px', // Coins arrondis type iOS 16+
          border: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.06)',
          padding: '6px',
          pointerEvents: 'auto',
          boxShadow: isDark
            ? '0 12px 40px rgba(0,0,0,0.4)'
            : '0 12px 32px rgba(0,0,0,0.06)',
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              ref={(el) => { btnRefs.current[id] = el; }}
              onClick={() => setActiveTab(id)}
              onPointerDown={() => handlePointerDown(id)}
              onPointerUp={() => handlePointerUp(id)}
              onPointerLeave={() => handlePointerUp(id)}
              onPointerCancel={() => handlePointerUp(id)}
              style={{
                // Coeur du morphing : l'onglet actif prend plus de place, les autres se serrent
                flex: isActive ? '1.8 1 0%' : '1 1 0%',
                display: 'flex',
                flexDirection: 'row', // Alignement horizontal des icônes + texte
                alignItems: 'center',
                justifyContent: 'center',
                gap: isActive ? '8px' : '0px',
                height: '100%',
                borderRadius: '18px',
                border: 'none',
                cursor: 'pointer',
                // Fond de pilule uniquement pour l'onglet actif
                background: isActive
                  ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)')
                  : 'transparent',
                color: isActive
                  ? (isDark ? '#FFF' : '#000') // Rendu ultra-natif, ou garde 'var(--theme-accent)'
                  : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.32)'),
                // Transition iOS-like fluide utilisant un bezier typique d'Apple
                transition: 'flex 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease, color 0.2s ease, transform 0.2s ease',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
                overflow: 'hidden', // Crucial pour cacher le texte qui se rétracte
                padding: '0 8px',
              }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <Icon active={isActive} />
              </span>

              {/* Texte expansif dynamique */}
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  letterSpacing: '-0.2px',
                  whiteSpace: 'nowrap',
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'translateX(0)' : 'translateX(10px)',
                  maxWidth: isActive ? '80px' : '0px',
                  transition: 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}