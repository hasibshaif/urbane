import type { Config } from 'tailwindcss'

const config = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      backgroundImage: {
        'hero-gradient':
          'radial-gradient(circle at top left, rgba(6,182,212,0.3), transparent 55%), radial-gradient(circle at bottom right, rgba(14,165,233,0.25), transparent 55%)',
      },
      boxShadow: {
        glow: '0 20px 45px -20px rgba(6,182,212,0.55)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      animation: {
        float: 'float 10s ease-in-out infinite',
        'fade-up': 'fadeUp 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config



