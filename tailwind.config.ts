import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        rose: "#F4A7B9",
        blue: "#A8D8EA",
        ovulation: "#FFF1A8",
        luteal: "#C3B1E1",
        petal: "#FFE5EC",
        blush: "#FFD6E0",
        berry: "#A64D79",
        peach: "#FFD6BA",
        mint: "#CDEAC0",
        cream: "#F7F3EF",
        charcoal: "#3D3D3D"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(61, 61, 61, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
