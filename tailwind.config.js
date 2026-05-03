/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Définition des polices pour ton projet
        outfit: ['"Outfit"', 'sans-serif'],
        galinoy: ['"galinoy"', 'serif'],
        // On garde sans par défaut sur Outfit pour plus de sécurité
        sans: ['"Outfit"', 'sans-serif'],
      },
      keyframes: {
        'slide-in-bottom': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
        'bubble-in': {
          '0%': { transform: 'scale(0.5) translateY(10px)', opacity: '0' },
          '70%': { transform: 'scale(1.05) translateY(-2px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-in-bottom': 'slide-in-bottom 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'bubble': 'bubble-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
    },
  },
  plugins: [],
}