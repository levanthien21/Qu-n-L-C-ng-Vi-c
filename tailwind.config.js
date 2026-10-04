/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Bảng màu thương hiệu (cam) lấy từ logo, thay thế toàn bộ tông indigo cũ
        indigo: {
          50: '#fff5ed',
          100: '#ffe8d4',
          200: '#ffcfa8',
          300: '#ffad70',
          400: '#ff8a3d',
          500: '#ff6a13',
          600: '#f25100',
          700: '#c93d03',
          800: '#a0320b',
          900: '#822c0c',
          950: '#461304',
        },
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.94) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,106,19,0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255,106,19,0)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .55s cubic-bezier(.22,1,.36,1) both',
        fadeIn: 'fadeIn .4s ease-out both',
        popIn: 'popIn .35s cubic-bezier(.22,1,.36,1) both',
        float: 'float 3.5s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        pulseGlow: 'pulseGlow 2s ease-out infinite',
        gradientShift: 'gradientShift 8s ease infinite',
      },
    },
  },
  plugins: [],
};
