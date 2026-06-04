import React from 'react';

/*
 * NavBar — barre de navigation fixe, stable sur iOS
 * ───────────────────────────────────────────────────
 * Points clés :
 *
 * 1. position:fixed + bottom:0 + left:0 + right:0
 *    L'élément s'ancre aux bords de la fenêtre native.
 *    Comme le conteneur App est lui-même position:fixed, la NavBar
 *    est toujours rendue sur le dessus sans interférer avec le layout.
 *
 * 2. paddingBottom via CSS env() plutôt que via une variable JS.
 *    env(safe-area-inset-bottom) est évalué nativement par le moteur
 *    CSS, même quand le viewport change ; c'est plus fiable que de
 *    propager la valeur depuis JavaScript.
 *
 * 3. La hauteur totale de la barre (onglets + safe area) est exposée
 *    via --navbar-total-height dans :root (index.css) et consommée
 *    comme paddingBottom dans #main-scroll-container.
 *    On ne la recalcule pas ici pour éviter les désynchronisations.
 */
export function NavBar({ activeTab, setActiveTab, isDark }) {
  const tabs = [
    {
      id: 'home',
      label: 'Accueil',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.5'}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Films',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.5'}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      id: 'studio',
      label: 'Studio',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.5'}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 15l.413 1.447 1.447.413-1.447.413L18.25 18.75l-.413-1.447-1.447-.413 1.447-.413L18.25 15zM15.75 4.5l.275.962.962.275-.962.275L15.75 6.962l-.275-.962-.962-.275.962-.275L15.75 4.5z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.5'}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        /*
         * On utilise les propriétés CSS individuelles plutôt que
         * className pour garantir que ces valeurs ne sont jamais
         * surchargées par Tailwind en cas de purge ou de conflit
         * de spécificité.
         */
        backgroundColor: 'var(--theme-nav-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--theme-border)',
        /*
         * paddingBottom : env() est ici la source de vérité.
         * Sur un iPhone avec encoche, cette valeur est ~34px.
         * Sur un simulateur ou un navigateur desktop, elle est 0.
         * On ne la stocke pas en JS pour éviter les désynchronisations.
         */
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/*
       * La zone des onglets a une hauteur fixe de 56px (= --navbar-tab-height).
       * La hauteur totale perçue est 56px + safe-area-inset-bottom.
       * Cette valeur est synchronisée avec --navbar-total-height dans :root.
       */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-around',
          height: '3.5rem', /* 56px — doit correspondre à --navbar-tab-height */
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
        }}
      >
        {tabs.map(({ id, label, icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--theme-accent)' : 'var(--theme-text)',
                opacity: isActive ? 1 : 0.35,
                transition: 'opacity 0.2s, transform 0.15s',
                WebkitTapHighlightColor: 'transparent',
                /*
                 * active:scale-95 via Tailwind interagit mal avec
                 * position:fixed sur certains moteurs iOS.
                 * On gère le feedback tactile ici via CSS pur.
                 */
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.93)'; }}
              onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1)'; }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.75rem', height: '1.75rem', marginBottom: '0.125rem' }}>
                {icon(isActive)}
              </div>
              <span
                className="font-outfit"
                style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1 }}
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