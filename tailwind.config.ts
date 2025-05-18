import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/(components)/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#002c55',
      },
      container: {
        center: true,
        padding: '1rem',
      },
      height: {
        'screen-90': '90vh',
      },
      backgroundImage: {
        'bla-gradient': 'linear-gradient(135deg, #3023AE 0%, #4E2FBD 50%, #000 100%)',
      },
    },
  },
  plugins: [],
};

export default config;