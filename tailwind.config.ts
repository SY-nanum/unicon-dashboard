import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design Ref: §5.2 — tech color palette (BF-BOF / EAF / DRI-H2)
        tech: {
          'bf-bof': '#4a5568',
          'eaf': '#3182ce',
          'dri-h2': '#38a169',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Malgun Gothic', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
