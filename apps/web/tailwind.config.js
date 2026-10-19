const color = (name) => `rgb(var(--rentra-${name}) / <alpha-value>)`;
const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const palette = (name) =>
  Object.fromEntries(shades.map((shade) => [shade, color(`${name}-${shade}`)]));

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: color('bg'),
        surface: color('surface'),
        surface2: color('surface-2'),
        surface3: color('surface-3'),
        text: color('text'),
        'text-muted': color('text-muted'),
        primary: color('primary'),
        'primary-hover': color('primary-hover'),
        'primary-soft': color('primary-soft'),
        'primary-contrast': color('primary-contrast'),
        danger: color('danger'),
        'danger-soft': color('danger-soft'),
        'danger-contrast': color('danger-contrast'),
        warning: color('warning'),
        'warning-soft': color('warning-soft'),
        info: color('info'),
        'info-soft': color('info-soft'),
        overlay: color('overlay'),
        border: color('border'),
        'border-strong': color('border-strong'),
        white: color('white'),
        black: color('black'),
        accent: color('primary'),
        gray: palette('gray'),
        slate: palette('gray'),
        zinc: palette('gray'),
        stone: palette('gray'),
        green: palette('green'),
        emerald: palette('green'),
        teal: palette('green'),
        red: palette('red'),
        rose: palette('red'),
        amber: palette('amber'),
        yellow: palette('amber'),
        orange: palette('amber'),
        blue: palette('blue'),
        indigo: palette('blue'),
        cyan: palette('blue'),
        purple: palette('blue'),
        violet: palette('blue'),
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
