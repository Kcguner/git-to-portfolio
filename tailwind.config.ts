import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        background: "#0a0a0c",
        surface: "#111115",
        "surface-elevated": "#16161c",
        border: "#22222a",
        "border-hover": "#2e2e3a",
        accent: "#10b981",
        "accent-hover": "#059669",
        "accent-dim": "rgba(16, 185, 129, 0.08)",
        "text-primary": "#f4f4f5",
        "text-secondary": "#a1a1aa",
        "text-muted": "#71717a",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out both",
        "slide-up": "slideUp 0.6s ease-out both",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "grid-move": "gridMove 20s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gridMove: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(40px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
