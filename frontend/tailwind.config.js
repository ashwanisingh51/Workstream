/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#fafafa',
        surface: '#111111',
        'surface-hover': '#1a1a1a',
        border: 'rgba(255, 255, 255, 0.1)',
        primary: {
          DEFAULT: '#00f0ff',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#7000ff',
          foreground: '#ffffff',
        },
        success: '#00ff9d',
        error: '#ff0055',
        muted: '#737373',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px #00f0ff' },
          '50%': { opacity: '.5', boxShadow: '0 0 20px #00f0ff' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
