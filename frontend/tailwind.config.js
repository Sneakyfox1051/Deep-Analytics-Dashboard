/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html'],
  theme: {
    extend: {
      colors: {
        awwa: {
          primary: '#E67E22',
          'primary-dark': '#5D2A2C',
          secondary: '#B08D57',
          accent: '#D35400',
          bg: '#FFFDF9',
          cream: '#FFF5E8',
          text: '#333333',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        awwa: '8px',
      },
      boxShadow: {
        'awwa-card':
          '0 20px 60px -15px rgba(93, 42, 44, 0.08), 0 0 0 1px rgba(230, 126, 34, 0.12)',
      },
    },
  },
  plugins: [],
};
