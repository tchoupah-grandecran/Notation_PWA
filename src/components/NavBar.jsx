/**
 * Barre de navigation fixée en bas de l'écran.
 * Reçoit l'onglet actif et le setter en props.
 */
export function NavBar({ activeTab, setActiveTab }) {
  const tabs = [
    {
      id: 'home',
      label: 'Accueil',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'Billets',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
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
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: (active) => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[80] bg-black/10 backdrop-blur-2xl border-t border-white/5">
      <div className="flex justify-around items-end h-[calc(40px+env(safe-area-inset-bottom))] pb-[calc(env(safe-area-inset-bottom)-12px)] pt-[10px]">
        {tabs.map(({ id, label, icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center w-16 transition-all ${
                active ? 'text-[var(--color-primary)]' : 'text-white opacity-40'
              }`}
            >
              {icon(active)}
              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}