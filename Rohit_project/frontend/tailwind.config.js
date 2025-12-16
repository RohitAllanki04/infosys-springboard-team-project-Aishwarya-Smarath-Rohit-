export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue'],
      },
      colors: {
        brand: {
          50: '#f5f3ff',
          500: '#7c3aed',
          600: '#6d28d9'
        }
      }
    },
  },
  plugins: [],
}
