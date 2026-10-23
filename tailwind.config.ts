import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sultan: {
          black: "#121317",
          orange: "#FF6B0D",
          white: "#FFFFFF",
          ink: "#1A1A1F",
          grey: "#737885",
          lightGrey: "#F4F4F5",
          lineGrey: "#D9D9DE",
          headerGrey: "#C7CCD6",
          cardLabelGrey: "#B3B8C4",
          cardDivider: "#4D4D59",
          footerGrey: "#BFC4D1",
          headerRing: "#292B33",
          darkStripe: "#59331A",
          errorRed: "#D64545",
          attentionTint: "#FFF0E5",
        },
      },
    },
  },
  plugins: [],
};

export default config;
