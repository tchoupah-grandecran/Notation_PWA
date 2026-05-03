// ==========================================
// THÈMES (Dark / Light avec texture Papier)
// ==========================================
export const THEME_COLORS = {
  dark: {
    key: 'dark',
    name: 'Sombre',
    bg: '#0A0A0A',
    surface: '#141414',
    border: 'rgba(255,255,255,0.08)',
    text: '#F0EAD6',
    textSecondary: 'rgba(240,234,214,0.45)',
    accent: '#C8A84B',
    accentMuted: 'rgba(200,168,75,0.12)',
    navBg: 'rgba(10,10,10,0.92)',
    grainOpacity: '0.04', // Very subtle on dark
  },
  light: {
    key: 'light',
    name: 'Clair',
    bg: '#F5F0E8', // Note: This cream color works perfectly with grain
    surface: '#FFFFFF',
    border: 'rgba(0,0,0,0.08)',
    text: '#1A1A1A',
    textSecondary: 'rgba(26,26,26,0.45)',
    accent: '#1A1A1A',
    accentMuted: 'rgba(26,26,26,0.06)',
    navBg: 'rgba(245,240,232,0.92)',
    grainOpacity: '0.07', // More visible on light for "analog" feel
  },
};

/**
 * Returns an object of CSS variable assignments.
 * Includes a background-image definition for the noise grain.
 */
export const THEME_TOKENS = (key = 'dark') => {
  const t = THEME_COLORS[key] || THEME_COLORS.dark;
  
  // This SVG creates a fractal noise pattern that simulates paper fiber/film grain
  const grainSvg = `
    <svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'>
      <filter id='noiseFilter'>
        <feTurbulence 
          type='fractalNoise' 
          baseFrequency='0.65' 
          numOctaves='3' 
          stitchTiles='stitch'/>
      </filter>
      <rect width='100%' height='100%' filter='url(#noiseFilter)'/>
    </svg>
  `.replace(/\n/g, "").replace(/"/g, "'");

  const grainDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(grainSvg)}`;

  return {
    '--theme-bg':             t.bg,
    '--theme-surface':        t.surface,
    '--theme-border':         t.border,
    '--theme-text':           t.text,
    '--theme-text-secondary': t.textSecondary,
    '--theme-accent':         t.accent,
    '--theme-accent-muted':   t.accentMuted,
    '--theme-nav-bg':         t.navBg,
    '--theme-grain-opacity':  t.grainOpacity,
    '--theme-grain-url':      `url("${grainDataUri}")`,
  };
};

// ==========================================
// GENRES
// ==========================================
export const GENRE_COLORS = {
  "Action": "bg-red-500/10 border-red-500/40 text-red-400",
  "Thriller": "bg-orange-600/10 border-orange-600/40 text-orange-400",
  "Policier": "bg-orange-900/20 border-orange-800/50 text-orange-200",
  "Comédie noire": "bg-zinc-800/40 border-zinc-600/50 text-zinc-300",
  "Comédie": "bg-yellow-400/10 border-yellow-400/40 text-yellow-300",
  "Romance": "bg-rose-400/10 border-rose-400/40 text-rose-300",
  "Animation": "bg-pink-500/10 border-pink-500/40 text-pink-300",
  "Musical": "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300",
  "Drame": "bg-blue-500/10 border-blue-500/40 text-blue-300",
  "Société": "bg-cyan-500/10 border-cyan-500/40 text-cyan-300",
  "Historique": "bg-amber-800/10 border-amber-700/40 text-amber-200",
  "Biopic": "bg-indigo-400/10 border-indigo-400/40 text-indigo-300",
  "Aventure": "bg-emerald-500/10 border-emerald-500/40 text-emerald-300",
  "Science fiction": "bg-purple-500/10 border-purple-500/40 text-purple-300",
  "Fantastique": "bg-violet-600/10 border-violet-500/40 text-violet-300",
  "Satire": "bg-lime-400/10 border-lime-400/40 text-lime-300",
  "Documentaire": "bg-teal-500/10 border-teal-500/40 text-teal-300",
  "default": "bg-white/5 border-white/20 text-white/70",
};

// ==========================================
// AVATARS
// ==========================================
export const AVATAR_PRESETS = [
  'https://i.imgur.com/54i18a4.png', 'https://i.imgur.com/wh92836.png',
  'https://i.imgur.com/0OmLvJA.png', 'https://i.imgur.com/6GdXcue.png',
  'https://i.imgur.com/gtbDH4p.png', 'https://i.imgur.com/0m6rNRf.png',
  'https://i.imgur.com/NWaeMDI.png', 'https://i.imgur.com/PYzEx97.png',
  'https://i.imgur.com/V5RJuqj.png', 'https://i.imgur.com/884g6CY.png',
  'https://i.imgur.com/cNIOilm.png', 'https://i.imgur.com/xEJPFzP.png',
  'https://i.imgur.com/SRm2Lvv.png',
];