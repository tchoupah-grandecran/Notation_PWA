export function NavBar({ activeTab, setActiveTab }) {
  const tabs = [
    {
      id: 'home',
      label: 'Accueil',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.2"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Films',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.2"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      id: 'studio',
      label: 'Studio',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.2"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 15l.413 1.447 1.447.413-1.447.413L18.25 18.75l-.413-1.447-1.447-.413 1.447-.413L18.25 15zM15.75 4.5l.275.962.962.275-.962.275L15.75 6.962l-.275-.962-.962-.275.962-.275L15.75 4.5z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.2"}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-[80] select-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Fond avec flou progressif (Glassmorphism de haut niveau) */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
      
      {/* Une ligne de séparation quasi-invisible pour le contraste */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative flex flex-row justify-around items-stretch px-4 h-16">
        {tabs.map(({ id, label, icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="relative flex-1 flex flex-col items-center justify-center outline-none group"
            >
              <div
                className={`flex flex-col items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                  active ? 'text-white scale-110' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {/* Icône */}
                <div className="relative">
                  {icon(active)}
                  {/* Petit halo lumineux derrière l'icône active */}
                  {active && (
                    <div className="absolute inset-0 bg-[var(--color-primary)]/20 blur-xl scale-150 -z-10" />
                  )}
                </div>

                {/* Label — Utilisation de Outfit */}
                <span
                  className={`text-[8px] mt-1.5 uppercase tracking-[0.15em] transition-all duration-300 font-outfit ${
                    active ? 'font-black opacity-100' : 'font-medium opacity-50'
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Indicateur de position (la petite barre sous l'onglet) */}
              <div 
                className={`absolute bottom-2 w-1 h-1 rounded-full bg-[var(--color-primary)] transition-all duration-500 ease-out ${
                  active ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}