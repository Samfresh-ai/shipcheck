import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        paper: "#fbfaf7",
        brand: {
          50: "#f0f4ff",
          100: "#dbe4ff",
          500: "#3b5bdb",
          600: "#364fc7",
          900: "#1a2a6c",
        },
        tier: {
          red: "#e03131",
          "red-bg": "#fff5f5",
          "red-dim": "#ffc9c9",
          amber: "#e67700",
          "amber-bg": "#fff9db",
          green: "#2f9e44",
          "green-bg": "#ebfbee",
        },
      },
      fontFamily: {
        sans: ["var(--font-plex)", "IBM Plex Sans", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        ledger: "0 18px 60px rgba(26, 42, 108, 0.08)",
      },
      gridTemplateColumns: {
        20: "repeat(20, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
};

export default config;
