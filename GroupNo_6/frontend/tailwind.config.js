/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f3e8ff',
          500: '#8B5CF6',
          600: '#A855F7',
          700: '#7C3AED',
        },
        secondary: {
          400: '#06B6D4',
          500: '#0891B2',
          600: '#0E7490',
        },
        accent: {
          400: '#F472B6',
          500: '#EC4899',
        },
        neutral: {
          50: '#FEFEFE',
          100: '#F8FAFC',
          800: '#1F2937',
          900: '#374151',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideIn': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        }
      }
    },
  },
  plugins: [],
}
