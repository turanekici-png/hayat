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
          green: "#6FB744",
          greenDark: "#4F9832",
          blue: "#0076B6",
          blueDark: "#005F95",
          orange: "#0076B6",
          orangeDark: "#005F95",
          mint: "#EAF7E6",
          dark: "#0B3F60",
          ink: "#2F4858",
          soft: "#F6FAFC",
          border: "#e1e1e1",
          gold: "#F2B84B"
        }
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        soft: "0 10px 40px rgba(0,0,0,0.05)",
        stk: "0 15px 50px -10px rgba(0, 0, 0, 0.08)",
        green: "0 10px 40px rgba(111,183,68,0.22)",
        orange: "0 10px 40px rgba(0,118,182,0.24)"
      }
    },
  },
  plugins: [],
};
export default config;
