/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hprh: {
          paper: '#F8FAFC',      // cool crisp slate-50 background (replaces old yellow paper)
          pine: '#0F172A',       // deep slate 900 — primary text, high contrast
          clay: '#4F46E5',       // electric indigo — primary brand CTA & action
          sage: '#0EA5E9',       // vibrant sky blue — secondary brand & links
          gold: '#10B981',       // emerald green — modern "available" status badge
          rose: '#F43F5E',       // vibrant rose — urgent / attention status
          'paper-dark': '#FFFFFF', // pure clean white for cards and surface layers
        },
        brand: {
          indigo: '#4F46E5',
          violet: '#7C3AED',
          sky: '#0EA5E9',
          cyan: '#06B6D4',
          emerald: '#10B981',
          rose: '#F43F5E',
          dark: '#0F172A',
          slate: '#475569',
          light: '#F8FAFC',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        utility: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.16' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      }
    },
  },
  plugins: [],
}
