import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export const fanmeetTailwindPreset: Partial<Config> = {
  content: [],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Inter', 'Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#FF6B35',
        'primary-hover': '#FF8C42',
        'primary-light': '#FFE5D9',
        'primary-dark': '#E63946',
        danger: '#DC3545',
        success: '#28A745',
        warning: '#FFC107',
        'gray-50': '#F8F9FA',
        'gray-100': '#E9ECEF',
        'gray-500': '#6C757D',
        'gray-900': '#212529',
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8F9FA',
          tertiary: '#E9ECEF',
        },
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.1)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 25px rgba(0,0,0,0.1)',
        glow: '0 0 20px rgba(255,107,53,0.3)',
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateX(400px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        toastOut: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(400px)' },
        },
      },
      animation: {
        pulse: 'pulse 2s infinite',
        shimmer: 'shimmer 2s infinite',
        'toast-in': 'toastIn 0.3s ease-out forwards',
        'toast-out': 'toastOut 0.2s ease-in forwards',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': {
          '--color-primary': '#FF6B35',
          '--color-primary-hover': '#FF8C42',
          '--color-primary-light': '#FFE5D9',
          '--color-danger': '#DC3545',
          '--color-success': '#28A745',
          '--color-warning': '#FFC107',
          '--text-primary': '#212529',
          '--text-secondary': '#6C757D',
          '--text-tertiary': '#ADB5BD',
          '--bg-primary': '#FFFFFF',
          '--bg-secondary': '#F8F9FA',
          '--bg-tertiary': '#E9ECEF',
          '--border-color': '#E9ECEF',
          '--shadow-sm': '0 1px 3px rgba(0,0,0,0.1)',
          '--shadow-md': '0 4px 6px rgba(0,0,0,0.1)',
          '--shadow-lg': '0 10px 25px rgba(0,0,0,0.1)',
        },
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
        body: {
          fontFamily: 'Inter, sans-serif',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
        },
      });
    }),
  ],
};
