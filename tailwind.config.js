/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'robuck': ['Robuck Regular', 'sans-serif'],
      },
      colors: {
        'main-bg': 'var(--color-main-bg)',
        'card-bg': 'var(--color-card-bg)',
        'subtle-bg': 'var(--color-subtle-bg)',
        'highlight-bg': 'var(--color-highlight-bg)',
        'hover-bg': 'var(--color-hover-bg)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'accent': 'var(--color-accent)',
        'custom-brown': 'var(--color-accent)',
        'border-color': 'var(--color-border-color)',
        'input-focus-border': 'var(--color-input-focus-border)',
      },
      animation: {
        modalShow: 'modalShow 0.3s ease-out forwards',
        slowPulse: 'slowPulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        modalShow: {
          '0%': { opacity: '0', transform: 'translateY(-1rem) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slowPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.02)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
}
