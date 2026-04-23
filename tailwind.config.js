/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        jyad: {
          primary: '#0B2545',
          accent: '#C9A961',
          background: '#FAFAF7',
          muted: '#6B7280',
          border: '#E5E7EB',
        },
      },
      fontFamily: {
        arabic: ['Tajawal', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
