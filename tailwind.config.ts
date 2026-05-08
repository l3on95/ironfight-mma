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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // IronFight MMA — Blood Red primary
        blood: {
          DEFAULT: "#dc2626",
          bright:  "#ef4444",
          deep:    "#991b1b",
          light:   "#fca5a5",
        },
        // IronFight MMA — Amber secondary
        amber: {
          DEFAULT: "#f59e0b",
          bright:  "#fbbf24",
          deep:    "#d97706",
        },
        // Ink scale (dark backgrounds)
        ink: {
          0: "#030406",
          1: "#07090C",
          2: "#0C1014",
          3: "#11161C",
          4: "#181E26",
          5: "#232A33",
          6: "#313B47",
        },
        // Foreground scale
        fg: {
          DEFAULT: "#FFFFFF",
          2: "#C9D1DA",
          3: "#8893A1",
          4: "#5A6573",
        },
        // Legacy aliases kept for backward compatibility
        cyan: {
          DEFAULT: "#dc2626",
          bright:  "#ef4444",
          deep:    "#991b1b",
        },
        pink: {
          DEFAULT: "#f59e0b",
          bright:  "#fbbf24",
          deep:    "#d97706",
        },
        carbon: {
          900: "#030406",
          800: "#07090C",
          700: "#0C1014",
          600: "#11161C",
          500: "#232A33",
          400: "#313B47",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Barlow Condensed", "Impact", "sans-serif"],
        sans:    ["var(--font-sans)",    "Inter",            "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)",    "JetBrains Mono",   "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.05) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(ellipse at top, rgba(220,38,38,0.1), transparent 60%)",
      },
      animation: {
        "pulse-slow":   "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-up":      "fadeUp 0.6s ease-out forwards",
        "work-pulse":   "workPulse 1s ease-in-out infinite",
        "dot-pulse":    "dotPulse 1.6s infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        workPulse: {
          "0%, 100%": { filter: "drop-shadow(0 0 0 rgba(220,38,38,0))" },
          "50%":      { filter: "drop-shadow(0 0 24px rgba(220,38,38,.6))" },
        },
        dotPulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: ".55", transform: "scale(.85)" },
        },
      },
      boxShadow: {
        "glow-blood":    "0 0 0 1px rgba(220,38,38,.4), 0 0 24px rgba(220,38,38,.35), 0 0 60px rgba(220,38,38,.15)",
        "glow-amber":    "0 0 0 1px rgba(245,158,11,.4), 0 0 24px rgba(245,158,11,.35)",
        "glow-blood-sm": "0 0 12px rgba(220,38,38,.5)",
        "glow-amber-sm": "0 0 12px rgba(245,158,11,.5)",
        // Legacy aliases
        "glow-cyan":     "0 0 0 1px rgba(220,38,38,.4), 0 0 24px rgba(220,38,38,.35), 0 0 60px rgba(220,38,38,.15)",
        "glow-pink":     "0 0 0 1px rgba(245,158,11,.4), 0 0 24px rgba(245,158,11,.35)",
        "glow-cyan-sm":  "0 0 12px rgba(220,38,38,.5)",
        "glow-pink-sm":  "0 0 12px rgba(245,158,11,.5)",
      },
    },
  },
  plugins: [],
};
export default config;
