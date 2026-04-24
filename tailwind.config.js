/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B2545',
          50: '#E8ECF3',
          100: '#C7D0E0',
          200: '#8FA1C2',
          300: '#5772A3',
          400: '#2E4A7A',
          500: '#0B2545',
          600: '#091E39',
          700: '#07162B',
          800: '#040F1D',
          900: '#02070F',
        },
        gold: {
          DEFAULT: '#C9A961',
          50: '#FAF5E8',
          100: '#F2E6C3',
          200: '#E5CD88',
          300: '#D9B874',
          400: '#D0AE68',
          500: '#C9A961',
          600: '#A98A43',
          700: '#7F6632',
          800: '#544321',
          900: '#2A2110',
        },
        bg: '#FAFAF7',
      },
      fontFamily: {
        sans: ['Tajawal', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        display: ['Tajawal', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,37,69,0.04), 0 4px 16px rgba(11,37,69,0.06)',
        pop: '0 10px 40px rgba(11,37,69,0.18)',
      },
    },
  },
  plugins: [],
};
