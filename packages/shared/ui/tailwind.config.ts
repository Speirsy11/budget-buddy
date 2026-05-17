import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../apps/**/*.{ts,tsx}",
    "../../packages/features/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        // BudgetBuddy V1 palette
        bg: "var(--bb-bg)",
        ink: {
          DEFAULT: "var(--bb-ink)",
          soft: "var(--bb-ink-soft)",
        },
        surface: {
          sage: "var(--bb-surface-sage)",
          peach: "var(--bb-surface-peach)",
          sky: "var(--bb-surface-sky)",
          lav: "var(--bb-surface-lav)",
          lemon: "var(--bb-surface-lemon)",
          linen: "var(--bb-surface-linen)",
          white: "var(--bb-surface-white)",
        },
        deep: {
          sage: "var(--bb-deep-sage)",
          peach: "var(--bb-deep-peach)",
          sky: "var(--bb-deep-sky)",
          lav: "var(--bb-deep-lav)",
          lemon: "var(--bb-deep-lemon)",
        },
        cat: {
          blue: "var(--bb-cat-blue)",
          pink: "var(--bb-cat-pink)",
          emerald: "var(--bb-cat-emerald)",
          amber: "var(--bb-cat-amber)",
          violet: "var(--bb-cat-violet)",
        },
        sidebar: {
          DEFAULT: "var(--bb-sidebar)",
          text: "var(--bb-sidebar-text)",
          muted: "var(--bb-sidebar-muted)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        bento: "28px",
        pill: "14px",
        chip: "10px",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "DM Sans",
          "Instrument Sans",
          "system-ui",
          "sans-serif",
        ],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      fontSize: {
        eyebrow: [
          "11px",
          { lineHeight: "1.2", letterSpacing: "0.06em", fontWeight: "600" },
        ],
        meta: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        stat: [
          "40px",
          { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "800" },
        ],
        hero: [
          "56px",
          { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "800" },
        ],
        greeting: [
          "36px",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
      },
      boxShadow: {
        card: "var(--bb-shadow-card)",
        float: "var(--bb-shadow-float)",
        btn: "var(--bb-shadow-btn)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-out-to-top": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-100%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-out-to-top": "slide-out-to-top 0.3s ease-out",
        shimmer: "shimmer 2s infinite linear",
        pulse: "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
