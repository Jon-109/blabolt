/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', 
    './lib/**/*.{js,ts,jsx,tsx,mdx}',  
    './app/page.tsx', 
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        'primary-blue': '#002c55',
        border: 'hsl(0, 0%, 14.9%)', // Matches --border in your CSS
        background: 'hsl(0, 0%, 98%)', // Matches --background in your CSS
        foreground: 'hsl(0, 0%, 14.9%)', // Matches --foreground in your CSS
        brand: {
          // ...rest of your config
        },
      },
    },
  },
  plugins: [],
};
