import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          darker: 'var(--color-primary-darker)',
          light: 'var(--color-primary-light)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
        },
        surface: 'var(--color-surface)',
        success: {
          DEFAULT: 'var(--color-success)',
          text: 'var(--color-success-text)',
          bg: 'var(--color-success-bg)',
        },
        warning: 'var(--color-warning)',
        error: {
          DEFAULT: 'var(--color-error)',
          text: 'var(--color-error-text)',
          bg: 'var(--color-error-bg)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
        },
        bg: 'var(--color-bg)',
        white: 'var(--color-white)',
        gray: {
          50: 'var(--color-gray-50)',
          800: 'var(--color-gray-800)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'Nunito Sans', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      fontSize: {
        'xs': 'var(--font-xs)',
        'sm': 'var(--font-sm)',
        'body': 'var(--font-body)',
        'nav': 'var(--font-nav)',
        'lg': 'var(--font-lg)',
        'xl': 'var(--font-xl)',
        '2xl': 'var(--font-2xl)',
        '3xl': 'var(--font-3xl)',
        '4xl': 'var(--font-4xl)',
        'h3': 'var(--font-h3)',
        'h2': 'var(--font-h2)',
        'h1': 'var(--font-h1)',
        'price': 'var(--font-price)',
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em',
        wider: '0.04em',
        widest: '0.08em',
      },
      lineHeight: {
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: 'var(--shadow-elevated)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        card: 'var(--shadow-card)',
        hover: 'var(--shadow-hover)',
        glass: 'var(--shadow-glass)',
        float: 'var(--shadow-float)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      screens: {
        '2xl': '1536px',
        '3xl': '1920px',
        '4xl': '2400px',
      },
    },
  },
  plugins: [],
};

export default config;
