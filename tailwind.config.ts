import type { Config } from "tailwindcss";

/**
 * Every colour resolves to a raw RGB triplet custom property, so Tailwind's
 * opacity modifiers (`border-border/50`, `bg-accent/20`) keep working while the
 * values themselves live in app/globals.css, where the paper palette, the night
 * print palette and the print remap are defined.
 */
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

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
        // Fraunces is self-hosted through @fontsource-variable/fraunces; see
        // app/fonts.scss. The serif fallbacks keep headings on a real serif
        // face if the webfont is unavailable.
        display: ["Fraunces", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        background: token("background"),
        surface: token("surface"),
        "surface-elevated": token("surface-elevated"),
        border: token("border"),
        "border-hover": token("border-hover"),
        accent: token("accent"),
        "accent-hover": token("accent-hover"),
        "accent-dim": "rgb(var(--color-accent) / 0.08)",
        "text-primary": token("text-primary"),
        "text-secondary": token("text-secondary"),
        "text-muted": token("text-muted"),
      },
      // The identity is static: no infinite motion ships. `fade-in` and
      // `slide-up` are one-shot entrances, both neutralised by the
      // prefers-reduced-motion block in globals.css.
      animation: {
        "fade-in": "fadeIn 0.6s ease-out both",
        "slide-up": "slideUp 0.6s ease-out both",
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
      },
    },
  },
  plugins: [],
};

export default config;
