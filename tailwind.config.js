/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          bg:       '#313338',
          sidebar:  '#2B2D31',
          accent:   '#5865F2',
          surface:  '#383A40',
          text:     '#DCDDDE',
          muted:    '#949BA4',
        },
      },
    },
  },
  plugins: [],
}
