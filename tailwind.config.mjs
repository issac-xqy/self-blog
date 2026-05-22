import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Microsoft YaHei"',
          '"PingFang SC"',
          '"Noto Sans SC"',
          '"Segoe UI"',
          "system-ui",
          "sans-serif",
        ],
        mono: [
          '"Cascadia Code"',
          '"JetBrains Mono"',
          '"Fira Code"',
          "monospace",
        ],
      },
      colors: {
        accent: {
          DEFAULT: "#2563eb",
          dark: "#60a5fa",
        },
      },
    },
  },
  plugins: [typography],
};
