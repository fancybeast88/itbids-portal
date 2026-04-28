/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      borderRadius: {
        xl: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.08)',
      },
    },
  },
  plugins: [],
}
