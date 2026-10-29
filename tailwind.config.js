/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0A0B10',
          surface: '#12141C',
          surfaceHover: '#181B26',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        light: {
          bg: '#F3F5FA',
          surface: '#FFFFFF',
          surfaceHover: '#F8FAFC',
          border: '#E1E5EE',
          text: '#172033',
          muted: '#596579',
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: 'rgba(99, 102, 241, 0.15)',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          light: 'rgba(239, 68, 68, 0.15)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          light: 'rgba(245, 158, 11, 0.15)',
        },
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
          light: 'rgba(16, 185, 129, 0.15)',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.3)',
        'glow-danger': '0 0 25px -5px rgba(239, 68, 68, 0.4)',
        'panel': '0 4px 20px -2px rgba(23, 32, 51, 0.05), 0 2px 6px -1px rgba(23, 32, 51, 0.03)',
      },
    },
  },
  plugins: [],
};