/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      colors: {
        // Modern Studio Dark / Camp Theme
        editor: {
          bg: '#0c1017',
          surface: '#131923',
          panel: '#18212e',
          header: '#151d29',
          input: '#0e141f',
          hover: '#222e40',
          border: '#222f42',
          divider: '#1c2737',
        },
        // Accent colors: Scout Gold/Amber & Forest Emerald
        accent: {
          DEFAULT: '#e08a1e',
          hover: '#f59e0b',
          muted: '#78350f',
          active: '#b45309',
          selection: '#1e3a5f',
          glow: 'rgba(224, 138, 30, 0.35)',
        },
        // Status colors
        status: {
          error: '#f43f5e',
          success: '#10b981',
          warning: '#f59e0b',
          info: '#38bdf8',
        },
        // Text hierarchy with WCAG AA/AAA compliance
        txt: {
          primary: '#f8fafc',
          secondary: '#cbd5e1',
          muted: '#94a3b8',
          disabled: '#64748b',
          accent: '#fbbf24',
        },
        // Category colors for element types
        cat: {
          spar: '#f59e0b',    // Golden amber wood
          lashing: '#10b981', // Emerald rope
          stake: '#a855f7',   // Purple stake
          guyline: '#38bdf8', // Sky blue tension cord
          guide: '#2dd4bf',   // Mint/Teal guides
        },
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        wood: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        }
      },
      borderRadius: {
        'dcc': '6px',
        'modern': '10px',
        'card': '12px',
        'pill': '9999px',
      },
      fontSize: {
        'micro': ['10px', '14px'],
        'xxs': ['11px', '16px'],
        'xs': ['12px', '18px'],
        'sm': ['13px', '20px'],
        'base': ['14px', '22px'],
      },
      boxShadow: {
        'glow-accent': '0 0 20px -4px rgba(224, 138, 30, 0.35)',
        'glow-emerald': '0 0 20px -4px rgba(16, 185, 129, 0.35)',
        'card-elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
