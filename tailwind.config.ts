import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: "var(--color-primary-dark)",
          DEFAULT: "var(--color-primary)",
        },
        accent: "var(--color-accent)",
        surface: {
          light: "var(--color-surface-light)",
        },
        background: {
          DEFAULT: "var(--color-background)",
          dark: "var(--color-background-dark)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          dark: "var(--color-text-on-dark)",
        },
        success: "var(--color-success)",
        danger: {
          DEFAULT: "var(--color-danger)",
          light: "var(--color-danger-light)",
        },
      },
      backgroundImage: {
        "gradient-hero": "var(--gradient-hero)",
        "gradient-surface": "var(--gradient-surface)",
        "gradient-balance-card": "var(--gradient-balance-card)",
        "gradient-bottom-fade": "var(--gradient-bottom-fade)",
        "gradient-accent-glow": "var(--gradient-accent-glow)",
      },
      fontFamily: {
        sans: [
          '"Instrument Sans"',
          '"SF Pro Display"',
          "-apple-system",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        primary: "var(--shadow-primary)",
        secondary: "var(--shadow-secondary)",
        hero: "var(--shadow-hero)",
      },
      borderRadius: {
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      fontSize: {
        "type-display": [
          "var(--type-display-size)",
          {
            lineHeight: "var(--type-display-line)",
            letterSpacing: "-0.02em",
            fontWeight: "var(--type-display-weight)",
          },
        ],
        "type-h1": [
          "var(--type-h1-size)",
          {
            lineHeight: "var(--type-h1-line)",
            letterSpacing: "-0.01em",
            fontWeight: "var(--type-h1-weight)",
          },
        ],
        "type-h2": [
          "var(--type-h2-size)",
          {
            lineHeight: "var(--type-h2-line)",
            letterSpacing: "-0.005em",
            fontWeight: "var(--type-h2-weight)",
          },
        ],
        "type-h3": [
          "var(--type-h3-size)",
          {
            lineHeight: "var(--type-h3-line)",
            fontWeight: "var(--type-h3-weight)",
          },
        ],
        "type-body": [
          "var(--type-body-size)",
          {
            lineHeight: "var(--type-body-line)",
            fontWeight: "var(--type-body-weight)",
          },
        ],
        "type-label": [
          "var(--type-label-size)",
          {
            lineHeight: "var(--type-label-line)",
            fontWeight: "var(--type-label-weight)",
          },
        ],
        "type-caption": [
          "var(--type-caption-size)",
          {
            lineHeight: "var(--type-caption-line)",
            letterSpacing: "0.02em",
            fontWeight: "var(--type-caption-weight)",
          },
        ],
      },
    },
  },
  plugins: [],
};

export default config;
