import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hayat: {
          green: "#6fae2e",
          greenDark: "#4f8a1e",
          blue: "#1593cf",
          blueDark: "#0c5e8a",
          orange: "#1593cf",
          orangeDark: "#0c5e8a",
          mint: "#e7f1d9",
          dark: "#0a3a55",
          ink: "#16272e",
          soft: "#f7f5ef",
          border: "#e2ddd0",
          gold: "#f4c762"
        }
      },
      fontFamily: {
        montserrat: ['Manrope', 'system-ui', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: "0 18px 45px rgba(10,58,85,0.08)",
        stk: "0 18px 45px rgba(10,58,85,0.08)",
        green: "0 14px 34px rgba(111,174,46,0.24)",
        orange: "0 14px 34px rgba(21,147,207,0.22)"
      }
    },
  },
  plugins: [],
};
export default config;
