import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
       fontFamily: {
        sans: [
          '-apple-system', 
          'BlinkMacSystemFont', 
          '"Segoe UI"', 
          'Roboto', 
          '"Helvetica Neue"', 
          'Arial', 
          'sans-serif'
        ],
        serif: ['Georgia', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", hover: "hsl(var(--primary-hover))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { 
          DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))",
          warm: { DEFAULT: "hsl(var(--accent-warm))", foreground: "hsl(var(--accent-warm-foreground))", hover: "hsl(var(--accent-warm-hover))" }
        },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        sidebar: { 
          DEFAULT: "hsl(var(--sidebar-background))", foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))", "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))", "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))", ring: "hsl(var(--sidebar-ring))"
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 4px 20px -4px hsl(0 100% 27% / 0.3)",
        card: "0 8px 30px -8px hsl(0 100% 27% / 0.4)",
        hero: "0 25px 50px -12px hsl(0 100% 27% / 0.5)",
        gold: "0 8px 30px -8px hsl(51 100% 50% / 0.4)",
        "gold-lg": "0 20px 50px -12px hsl(51 100% 50% / 0.5)",
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, hsl(0 100% 27%) 0%, hsl(0 100% 18%) 100%)",
        "gradient-hero-accent": "linear-gradient(135deg, hsl(0 100% 27%) 0%, hsl(0 100% 36%) 50%, hsl(0 0% 0%) 100%)",
        "gradient-card": "linear-gradient(145deg, hsl(0 100% 8%) 0%, hsl(0 100% 5%) 100%)",
        "gradient-warm": "linear-gradient(135deg, hsl(51 100% 50%) 0%, hsl(39 100% 50%) 100%)",
        "gradient-dark": "linear-gradient(180deg, hsl(0 0% 0%) 0%, hsl(0 100% 5%) 100%)",
        "gradient-reverse": "linear-gradient(180deg, hsl(0 100% 5%) 0%, hsl(0 0% 0%) 100%)",
        "gradient-feature": "linear-gradient(145deg, hsl(0 100% 27%) 0%, hsl(0 100% 22%) 100%)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "100% 50%" } },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in-up": { "0%": { opacity: "0", transform: "translateY(30px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right": { "0%": { opacity: "0", transform: "translateX(50px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.9)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "bounce-gentle": { "0%, 20%, 50%, 80%, 100%": { transform: "translateY(0)" }, "40%": { transform: "translateY(-10px)" }, "60%": { transform: "translateY(-5px)" } },
        "glow-pulse": { "0%, 100%": { boxShadow: "0 0 20px rgba(255, 215, 0, 0.3)" }, "50%": { boxShadow: "0 0 40px rgba(255, 215, 0, 0.6)" } },
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "slide-in-right": "slide-in-right 0.8s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        "bounce-gentle": "bounce-gentle 2s infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      gridTemplateColumns: {
        "logo-grid": "repeat(auto-fit, minmax(200px, 1fr))",
        "logo-grid-md": "repeat(2, 1fr)",
        "logo-grid-sm": "1fr",
      },
      gap: {
        "logo-lg": "2rem",
        "logo-md": "1rem",
        "logo-sm": "1rem",
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config;
