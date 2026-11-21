/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils.ts',
  ],
  theme: {
    extend: {
      colors: {
        // Existing palette: keep, the current screens use it.
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // New design tokens. Values live in index.css (:root and .dark).
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        soft: 'var(--soft)',
        action: 'var(--action)',
        'on-action': 'var(--on-action)',
        accent: 'var(--accent)',
        'accent-fill': 'var(--accent-fill)',
        sun: 'var(--sun)',
        warn: 'var(--warn)',
        water: 'var(--water)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'Instrument Sans Variable', 'system-ui', 'sans-serif'],
        body: ['"Instrument Sans Variable"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      keyframes: {
        'toast-in': { from: { opacity: '0', transform: 'translateY(10px) scale(.98)' } },
        'dd-in': { from: { opacity: '0', transform: 'translateY(-6px) scale(.97)' } },
        'fade-fast': { from: { opacity: '0' } },
        'sheet-in': { from: { opacity: '0', transform: 'translateY(14px) scale(.98)' } },
        'sheet-up': { from: { transform: 'translateY(40px)', opacity: '.6' } },
      },
      animation: {
        'toast-in': 'toast-in .25s cubic-bezier(.2,.8,.2,1)',
        'dd-in': 'dd-in .16s cubic-bezier(.2,.8,.2,1)',
        'fade-fast': 'fade-fast .2s ease-out',
        'sheet-in': 'sheet-in .25s cubic-bezier(.2,.8,.2,1)',
        'sheet-up': 'sheet-up .28s cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
};