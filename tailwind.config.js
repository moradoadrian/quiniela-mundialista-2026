/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        worldcup: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#10b981',
          accentHover: '#059669',
          gold: '#eab308',
          home: '#3b82f6',
          draw: '#64748b',
          away: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

