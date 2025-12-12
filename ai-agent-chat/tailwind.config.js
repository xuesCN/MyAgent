/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        "tech-dark": "#0F1117",
        "tech-gray": "#1A1D23",
        "tech-blue": "#00d4ff",
        "tech-purple": "#8b5cf6",
        "tech-green": "#00ff88",
        border: "#333333",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        typing: "typing 2s steps(20, end)",
        blink: "blink 1s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        gradient: "gradient 8s linear infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        typing: {
          from: { width: "0" },
          to: { width: "100%" },
        },
        blink: {
          "from, to": { "border-color": "transparent" },
          "50%": { "border-color": "#00d4ff" },
        },
        gradient: {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": {
            "box-shadow": "0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 15px #00d4ff",
          },
          "100%": {
            "box-shadow":
              "0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff",
          },
        },
      },
    },
  },
  plugins: [],
};
