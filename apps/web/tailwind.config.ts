/* eslint-disable ts/no-require-imports */
import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        cr: {
          primary: {
            DEFAULT: 'oklch(var(--cr-primary) / <alpha-value>)',
            hover: 'oklch(var(--cr-primary-hover) / <alpha-value>)',
            soft: 'oklch(var(--cr-primary-soft) / <alpha-value>)',
            fg: 'oklch(var(--cr-primary-fg) / <alpha-value>)',
          },
          bg: 'oklch(var(--cr-bg) / <alpha-value>)',
          surface: {
            DEFAULT: 'oklch(var(--cr-surface) / <alpha-value>)',
            raised: 'oklch(var(--cr-surface-raised) / <alpha-value>)',
          },
          border: {
            DEFAULT: 'oklch(var(--cr-border) / <alpha-value>)',
            subtle: 'oklch(var(--cr-border-subtle) / <alpha-value>)',
          },
          fg: {
            DEFAULT: 'oklch(var(--cr-fg) / <alpha-value>)',
            secondary: 'oklch(var(--cr-fg-secondary) / <alpha-value>)',
            muted: 'oklch(var(--cr-fg-muted) / <alpha-value>)',
          },
          score: {
            critical: {
              DEFAULT: 'oklch(var(--cr-score-critical) / <alpha-value>)',
              soft: 'oklch(var(--cr-score-critical-soft) / <alpha-value>)',
            },
            poor: {
              DEFAULT: 'oklch(var(--cr-score-poor) / <alpha-value>)',
              soft: 'oklch(var(--cr-score-poor-soft) / <alpha-value>)',
            },
            fair: {
              DEFAULT: 'oklch(var(--cr-score-fair) / <alpha-value>)',
              soft: 'oklch(var(--cr-score-fair-soft) / <alpha-value>)',
            },
            good: {
              DEFAULT: 'oklch(var(--cr-score-good) / <alpha-value>)',
              soft: 'oklch(var(--cr-score-good-soft) / <alpha-value>)',
            },
            excellent: {
              DEFAULT: 'oklch(var(--cr-score-excellent) / <alpha-value>)',
              soft: 'oklch(var(--cr-score-excellent-soft) / <alpha-value>)',
            },
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;

export default config;
