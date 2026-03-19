/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        syne: ['"Syne"', 'sans-serif'],
      },
      // --- NOUVEAU : DÉFINITION DES ANIMATIONS ---
      keyframes: {
        'slide-in-bottom': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
    },
  plugins: [],
}