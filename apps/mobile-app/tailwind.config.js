/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ration: {
          dark: '#0B132B',
          navy: '#1C2541',
          blue: '#3A506B',
          teal: '#48E5C2',
          amber: '#F39C12',
          emerald: '#2ECC71',
          slate: '#F4F6F7',
          card: '#162036',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-teal': '0 0 20px -5px rgba(72, 229, 194, 0.4)',
        'glow-amber': '0 0 20px -5px rgba(243, 156, 18, 0.4)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      }
    },
  },
  plugins: [],
}
