/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Définit DM Sans comme police par défaut pour toute l'app
        sans: ['"DM Sans"', 'sans-serif'],
        // Crée la classe custom 'font-syne'
        syne: ['"Syne"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}