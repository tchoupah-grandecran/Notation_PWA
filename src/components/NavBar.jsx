import React from 'react';

export function NavBar({ activeTab, setActiveTab, isDark }) {
  const tabs = [
    {
      id: 'home',
      label: 'Accueil',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.5"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Films',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.5"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      id: 'studio',
      label: 'Studio',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.5"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 15l.413 1.447 1.447.413-1.447.413L18.25 18.75l-.413-1.447-1.447-.413 1.447-.413L18.25 15zM15.75 4.5l.275.962.962.275-.962.275L15.75 6.962l-.275-.962-.962-.275.962-.275L15.75 4.5z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.5"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] w-full border-t"
      style={{
        backgroundColor: 'var(--theme-nav-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)', // Safari support
        borderColor: 'var(--theme-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch justify-around h-[56px] px-2">
        {tabs.map(({ id, label, icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex flex-1 flex-col items-center justify-center transition-all duration-200 active:scale-95"
              style={{
                color: isActive 
                  ? 'var(--theme-accent)' 
                  : 'var(--theme-text)',
                opacity: isActive ? 1 : 0.35,
              }}
            >
              {/* Icon Container */}
              <div className="flex items-center justify-center h-7 w-7 mb-0.5">
                {icon(isActive)}
              </div>

              {/* Label */}
              <span 
                className="font-outfit uppercase tracking-widest leading-none"
                style={{ fontSize: '9px' }}
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