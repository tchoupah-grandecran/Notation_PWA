/**
 * Barre de navigation fixée en bas de l'écran.
 * Reçoit l'onglet actif et le setter en props.
 */
export function NavBar({ activeTab, setActiveTab }) {
  const tabs = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? "2" : "1.5"}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Historique',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? "2" : "1.5"}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: 'studio',
      label: 'Studio',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? "2" : "1.5"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: (active) => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? "2" : "1.5"}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-[80] bg-[#0A0A0A]/85 backdrop-blur-2xl border-t border-white/10 select-none"
      style={{
        // Extend the background visually below the safe area
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* The visible tab row — always 56px tall, sits above the safe area fill */}
      <div className="flex flex-row justify-around items-center px-2 h-14">
        {tabs.map(({ id, label, icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 h-full flex flex-col items-center justify-center outline-none group"
            >
              <div
                className={`flex flex-col items-center justify-center transition-all duration-300 ease-out transform group-active:scale-90 ${
                  active
                    ? 'text-[var(--color-primary)] translate-y-0'
                    : 'text-white/40 translate-y-[2px] hover:text-white/60'
                }`}
              >
                {icon(active)}
                <span
                  className={`text-[9px] uppercase mt-1 tracking-widest transition-all duration-300 ${
                    active ? 'font-black' : 'font-semibold'
                  }`}
                >
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}