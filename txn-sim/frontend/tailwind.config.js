/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        console: {
          bg: "#0B0E11",
          panel: "#12161B",
          panelAlt: "#171C22",
          border: "#232A32",
          borderLight: "#2E363F",
          text: "#D8DEE4",
          textDim: "#8B96A3",
          textFaint: "#5C6672",
        },
        accent: {
          teal: "#2DD4BF",
          amber: "#F5A524",
          red: "#F5474C",
          blue: "#4F9CF9",
        },
      },
      fontFamily: {
        display: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 1px 3px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
