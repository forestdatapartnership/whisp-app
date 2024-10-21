import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
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
        // Define custom color names or override existing ones
        'custom-foreground': 'rgb(var(--foreground-rgb))',
        'custom-background-start': 'rgb(var(--background-start-rgb))',
        'custom-background-end': 'rgb(var(--background-end-rgb))',
      },
      // Use the custom colors for backgrounds, text, borders, etc.
      backgroundColor: {
        'dark': 'rgb(var(--background-start-rgb))', // For direct bg color use
        'dark-gradient-end': 'rgb(var(--background-end-rgb))',
      },
      textColor: {
        'dark': 'rgb(var(--foreground-rgb))',
      },
      // Extend other theme properties as needed using your CSS variables
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // You can also define gradients using your variables if needed
        'dark-gradient': 'linear-gradient(to bottom, transparent, rgb(var(--background-end-rgb)))',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config