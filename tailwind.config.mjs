/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'brand': {
          red: '#e60000', // New Yorker style red
          black: '#000000',
          white: '#ffffff',
        },
        'gray': {
          100: '#f5f5f5', // light bg
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'urban': ['"Roboto Condensed"', 'Arial', 'sans-serif'], // For headers
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      }
    },
  },
  plugins: [],
}
