import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        leather: {
          900: '#3B1F0A',
          700: '#6B3A1F',
          500: '#A0522D',
          300: '#C8956C',
        },
        cream: {
          50: '#FEFAEF',
          100: '#F5EDD8',
          200: '#EDD9B8',
        },
        ink: {
          900: '#1A1008',
          500: '#4A3728',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
