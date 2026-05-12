/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#F5F3F1',
        surface: '#FFFFFF',
        'surface-alt': '#FAFAF8',
        border: '#ECE8E3',
        'border-strong': '#DDD6CC',
        point: '#9686BF',
        'point-dark': '#7668A3',
        'point-light': '#C4B8E0',
        'point-soft': '#E8E3F3',
        'point-softer': '#F3EFFA',
        text: '#2B2730',
        'text-sub': '#6B6573',
        'text-soft': '#A09AAA',
        success: '#7BB894',
        'success-soft': '#E4F1E8',
        'success-dark': '#3E9F7A',
        warn: '#E8B76B',
        'warn-soft': '#FCF1DB',
        'warn-dark': '#B9823A',
        danger: '#D97878',
        'danger-soft': '#FBEAEA',
      },
    },
  },
  plugins: [],
}
