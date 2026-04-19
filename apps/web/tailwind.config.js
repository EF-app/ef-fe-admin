/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        point: 'var(--color-point)',
        'point-dark': 'var(--color-point-dark)',
        'point-light': 'var(--color-point-light)',
        'point-soft': 'var(--color-point-soft)',
        'point-softer': 'var(--color-point-softer)',
        text: 'var(--color-text)',
        'text-sub': 'var(--color-text-sub)',
        'text-soft': 'var(--color-text-soft)',
        success: 'var(--color-success)',
        warn: 'var(--color-warn)',
        danger: 'var(--color-danger)',
        'danger-soft': 'var(--color-danger-soft)',
      },
      fontFamily: {
        sans: ['NanumSquareNeo', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        point: 'var(--shadow-point)',
      },
    },
  },
  plugins: [],
}
