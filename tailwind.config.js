/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arcade: {
          bg: "#0B0E14",
          card: "#151A23",
          border: "#232A38",
          accent: "#00F0FF",
          pink: "#FF007A",
          yellow: "#FFE600",
          purple: "#8A2BE2",
          green: "#00FFA3",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space)", "Impact", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s infinite ease-in-out",
        "bounce-slight": "bounceSlight 1s infinite alternate ease-in-out",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        bounceSlight: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};
