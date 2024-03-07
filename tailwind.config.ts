import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
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
    },
  },
  plugins: [],
};

export default config;
