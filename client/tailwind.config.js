/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#315A67',
        'primary-soft': '#E7F0F2',
        accent: '#7AA6B2',
        background: '#F8FAF9',
        surface: '#FFFFFF',
        text: '#18232A',
        muted: '#6B7C85',
        border: '#DCE5E8',
        success: '#3F8F6B',
        pending: '#8A7A5C',
        emergency: '#C94A44',
        'primary-hover': '#27484F',
        'surface-sunken': '#F1F4F3',
        'success-soft': '#E3F1EA',
        'pending-soft': '#F1ECE3',
        'emergency-soft': '#F8E6E5',
        'emergency-hover': '#A93B36',
      },
    },
  },
  plugins: [],
};
