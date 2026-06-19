/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        coral: {
          50: "#FFF1F0",
          100: "#FFE0DE",
          200: "#FFC7C5",
          300: "#FF9E9C",
          400: "#FF6B6B",
          500: "#FF4747",
          600: "#E52E2E",
          700: "#C42020",
          800: "#9D1C1C",
          900: "#801B1B",
        },
        cream: {
          50: "#FFFDF9",
          100: "#FFF8F0",
          200: "#FFF0E0",
          300: "#FFE4C8",
          400: "#FFD4A8",
          500: "#FFC488",
        },
        mint: {
          50: "#EDFCFB",
          100: "#D1F7F4",
          200: "#A7EFE9",
          300: "#6EE3DA",
          400: "#4ECDC4",
          500: "#2AB5AC",
          600: "#1F9089",
          700: "#1E736E",
          800: "#1F5B58",
          900: "#1D4C49",
        },
      },
      fontFamily: {
        display: ["Nunito", "sans-serif"],
        body: ["Noto Sans SC", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "card": "0 4px 24px -4px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 8px 32px -4px rgba(0, 0, 0,0.12)",
        "glow": "0 0 20px rgba(255, 107, 107, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
