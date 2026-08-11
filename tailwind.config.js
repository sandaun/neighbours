/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#803EF6', dark: '#6714DD', on: '#FFFFFF' },
        secondary: { DEFAULT: '#50E3C2', txt: '#006B58' },
        tertiary: { DEFAULT: '#FFBA00', txt: '#6C4D00' },
        surface: { DEFAULT: '#FFFFFF', hi: '#F0E3FF' },
        bg: '#FAFBFC',
        ink: { DEFAULT: '#321461', soft: '#4A4455', muted: '#7B7487' },
        outline: '#CCC3D8',
        danger: { DEFAULT: '#BA1A1A', dark: '#8F1414', soft: '#C13B3B' },
        highlight: '#D2BCFF',
        // Mode fosc (proposta pendent de validació — DESIGN_SYSTEM.md §1.2):
        'bg-dark': '#140A24',
        'surface-dark': { DEFAULT: '#1E1132', hi: '#33204F' },
        'ink-dark': { DEFAULT: '#EFE7FF', soft: '#B9AECC' },
        'outline-dark': '#44355E',
        'primary-darkmode': '#9B6BFF',
      },
      fontFamily: {
        display: ['PlayfairDisplay_700Bold'],
        'display-semi': ['PlayfairDisplay_600SemiBold'],
        body: ['PlusJakartaSans_400Regular'],
        'body-semi': ['PlusJakartaSans_600SemiBold'],
        label: ['Montserrat_600SemiBold'],
      },
      borderRadius: {
        sm: '10px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        pill: '34px',
      },
    },
  },
};
