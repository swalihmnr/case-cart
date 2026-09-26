/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./src/views/**/*.{ejs,html,js}",
    "./public/**/*.{js,html}"
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0A0A0A',
          light: '#121212',
          surface: '#1A1A1A',
          hover: '#262626',
          muted: '#262626',
        },
        'obsidian-light': '#121212',
        'obsidian-surface': '#1A1A1A',
        'obsidian-hover': '#262626',
        ivory: {
          DEFAULT: '#F7F5F2',
          muted: '#E5E3E0',
        },
        gold: {
          light: '#E8D5B0',
          accent: '#C9A84C',
        },
        'gold-light': '#E8D5B0',
        'gold-accent': '#C9A84C',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', '"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
