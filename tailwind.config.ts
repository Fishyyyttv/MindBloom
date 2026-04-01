import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        sage: {
          50:  '#f4f7f4',
          100: '#e8f0e8',
          200: '#c9daca',
          300: '#a8c5aa',
          400: '#7c9a7e',
          500: '#5e7e60',
          600: '#4a634c',
          700: '#3c503e',
          800: '#2f3e30',
          900: '#1e2a1f',
        },
        cream: '#FAF7F2',
        blush: {
          100: '#f5e6e0',
          300: '#e8c4b8',
          500: '#d4967f',
        },
        mindbloom: {
          bg:      '#FAF7F2',
          surface: '#FFFDF9',
          border:  'rgba(124,154,126,0.18)',
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'card': '0 2px 16px rgba(44,44,44,0.06), 0 1px 4px rgba(44,44,44,0.04)',
        'card-hover': '0 8px 32px rgba(44,44,44,0.10), 0 2px 8px rgba(44,44,44,0.06)',
        'glow': '0 0 40px rgba(124,154,126,0.15)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'breathe-in': 'breatheIn 4s ease-in-out forwards',
        'breathe-out': 'breatheOut 4s ease-in-out forwards',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        breatheIn: {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(1.4)', opacity: '1' },
        },
        breatheOut: {
          '0%': { transform: 'scale(1.4)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0.7' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
