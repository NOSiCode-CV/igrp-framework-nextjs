import { cva } from "class-variance-authority"

/** CVA variants for border radius (none, sm, md, lg, xl, 2xl, 3xl, 4xl, full). */
export const igrpRounded = cva("", {
  variants: {
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      "4xl": "rounded-4xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    rounded: "md",
  },
})
