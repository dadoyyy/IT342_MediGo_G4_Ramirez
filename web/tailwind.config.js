/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        navy: '#2B2D42',
        crimson: '#EF233C',
        ruby: '#D90429',
        slate: '#8D99AE',
        mist: '#EDF2F4',
        
        // Semantic aliases
        bg: '#EDF2F4',
        surface: '#FFFFFF',
        panel: '#2B2D42',
        
        // Text colors
        text: {
          primary: '#2B2D42',
          secondary: '#6B7280',
          'on-dark': '#EDF2F4',
        },
        
        // Glass colors
        glass: {
          white: 'rgba(255, 255, 255, 0.7)',
          border: 'rgba(255, 255, 255, 0.2)',
        },
        
        backdrop: 'rgba(0, 0, 0, 0.5)',
      },
      
      spacing: {
        'xs': '0.25rem',   // 4px
        'sm': '0.5rem',    // 8px
        'md': '1rem',      // 16px
        'lg': '1.5rem',    // 24px
        'xl': '2rem',      // 32px
        '2xl': '3rem',     // 48px
        '3xl': '4rem',     // 64px
        '4xl': '6rem',     // 96px
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.5' }],     // 14px
        'base': ['1rem', { lineHeight: '1.5' }],       // 16px
        'lg': ['1.125rem', { lineHeight: '1.5' }],     // 18px
        'xl': ['1.25rem', { lineHeight: '1.5' }],      // 20px
        '2xl': ['1.5rem', { lineHeight: '1.2' }],      // 24px
        '3xl': ['2rem', { lineHeight: '1.2' }],        // 32px
        '4xl': ['2.5rem', { lineHeight: '1.2' }],      // 40px
      },
      
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      
      lineHeight: {
        tight: '1.2',
        normal: '1.5',
        relaxed: '1.75',
      },
      
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.07)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.15)',
        '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(239, 35, 60, 0.3)',
        'glow-hover': '0 8px 28px rgba(239, 35, 60, 0.35)',
      },
      
      borderRadius: {
        'sm': '0.375rem',   // 6px
        'md': '0.5rem',     // 8px
        'lg': '0.75rem',    // 12px
        'xl': '1rem',       // 16px
        '2xl': '1.5rem',    // 24px
        'full': '9999px',
      },
      
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '10px',
        'lg': '20px',
        'xl': '40px',
      },
      
      screens: {
        'mobile': '640px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1280px',
        'ultrawide': '1536px',
      },
      
      animation: {
        'blob-drift': 'blob-drift 9s ease-in-out infinite',
        'blob-drift-2': 'blob-drift-2 11s ease-in-out infinite',
        'blob-drift-3': 'blob-drift 14s ease-in-out infinite reverse',
        'float-y': 'float-y 5s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      
      keyframes: {
        'blob-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(24px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-18px, 16px) scale(0.97)' },
        },
        'blob-drift-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-28px, 18px) scale(1.03)' },
          '66%': { transform: 'translate(22px, -12px) scale(0.98)' },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-9px)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
