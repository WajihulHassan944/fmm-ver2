import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        madness: {
          black: "#05080d",
          panel: "#0b121a",
          card: "#101820",
          red: "#df111b",
          green: "#22c55e",
          gold: "#fbbf24",
          blue: "#0ea5e9",
          purple: "#a855f7"
        }
      },
      boxShadow: {
        glow: "0 0 35px rgba(223,17,27,.22)",
        greenGlow: "0 0 30px rgba(34,197,94,.18)"
      }
    }
  },
  plugins: []
} satisfies Config;
