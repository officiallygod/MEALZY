import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        neon: {
          lime: "#D4FF00",
          yellow: "#E8FA43",
          green: "#22C55E",
        },
        cyber: {
          pink: "#FF3388",
          coral: "#FF5C5C",
          purple: "#C084FC",
          violet: "#8B5CF6",
          blue: "#38BDF8",
        },
        funky: {
          black: "#0A0B0E",
          surface: "#12141B",
          card: "#181A24",
          border: "#262938",
          muted: "#8B92A7",
          cream: "#FAF8F5",
          sand: "#F3EFEA",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "'Plus Jakarta Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        funky: ["var(--font-funky)", "'Space Grotesk'", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neo: "3px 3px 0px #000000",
        "neo-lg": "5px 5px 0px #000000",
        "neo-lime": "4px 4px 0px #D4FF00",
        "neo-pink": "4px 4px 0px #FF3388",
        glow: "0 0 25px -5px rgba(212, 255, 0, 0.4)",
      },
      borderRadius: {
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
