/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#08111F",
        card: "#111827",
        "card-hover": "#162235",
        "card-secondary": "#162235",
        accent: "#16E0BD",
        positive: "#22C55E",
        negative: "#EF4444",
        warning: "#F59E0B",
        "text-primary": "#FFFFFF",
        "text-secondary": "#94A3B8",
        border: "rgba(255, 255, 255, 0.05)",
        "border-hover": "rgba(255, 255, 255, 0.1)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "glass": "0 4px 30px rgba(0, 0, 0, 0.3)",
        "glass-hover": "0 8px 30px rgba(22, 224, 189, 0.1)",
      },
    },
  },
  plugins: [],
}