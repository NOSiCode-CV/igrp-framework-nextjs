/**
 * Tailwind class mappings for color variants (outline, solid, soft).
 * Used for badges, alerts, cards, etc.
 *
 * All classes use semantic tokens from tokens.css. Dark mode is handled
 * automatically by token theming — never reintroduce raw palette colors
 * (e.g. `bg-emerald-500`, `text-red-600 dark:text-red-400`) here.
 *
 * Variant slot conventions:
 * - `outline`: transparent bg, colored text + border (low-emphasis chip)
 * - `solid`:   filled bg with high-contrast foreground (emphasis CTA)
 * - `soft`:    tinted bg (10% opacity) with colored text (info chip)
 */
export const IGRPColors = {
  outline: {
    primary: {
      bg: "bg-transparent",
      text: "text-primary",
      border: "border-primary",
      bgForeground: "bg-primary",
      badge: "text-primary border-primary",
      textCard: "text-primary",
      bgCardIcon: "bg-primary/10",
      borderCard: "border-primary",
      alert: "text-primary bg-transparent border-primary/50",
    },
    success: {
      bg: "bg-transparent",
      text: "text-success",
      border: "border-success",
      bgForeground: "bg-success",
      badge: "text-success bg-transparent border-success",
      textCard: "text-success",
      bgCardIcon: "bg-success/10",
      borderCard: "border-success",
      alert: "text-success bg-transparent border-success/50",
    },
    destructive: {
      bg: "bg-transparent",
      text: "text-destructive",
      border: "border-destructive",
      bgForeground: "bg-destructive",
      badge: "text-destructive bg-transparent border-destructive",
      textCard: "text-destructive",
      bgCardIcon: "bg-destructive/10",
      borderCard: "border-destructive",
      alert: "text-destructive bg-transparent border-destructive/50",
    },
    warning: {
      bg: "bg-transparent",
      text: "text-warning",
      border: "border-warning",
      bgForeground: "bg-warning",
      badge: "text-warning bg-transparent border-warning",
      textCard: "text-warning",
      bgCardIcon: "bg-warning/10",
      borderCard: "border-warning",
      alert: "text-warning bg-transparent border-warning/50",
    },
    info: {
      bg: "bg-transparent",
      text: "text-info",
      border: "border-info",
      bgForeground: "bg-info",
      badge: "text-info bg-transparent border-info",
      textCard: "text-info",
      bgCardIcon: "bg-info/10",
      borderCard: "border-info",
      alert: "text-info bg-transparent border-info/50",
    },
    secondary: {
      bg: "bg-transparent",
      text: "text-muted-foreground",
      border: "border-border",
      bgForeground: "bg-muted-foreground",
      badge: "text-muted-foreground bg-transparent border-border",
      textCard: "text-muted-foreground",
      bgCardIcon: "bg-muted",
      borderCard: "border-border",
      alert: "text-muted-foreground bg-transparent border-border",
    },
    indigo: {
      bg: "bg-transparent",
      text: "text-indigo",
      border: "border-indigo",
      bgForeground: "bg-indigo",
      badge: "text-indigo bg-transparent border-indigo",
      textCard: "text-indigo",
      bgCardIcon: "bg-indigo/10",
      borderCard: "border-indigo",
      alert: "text-indigo bg-transparent border-indigo/50",
    },
  },
  solid: {
    primary: {
      bg: "bg-primary hover:bg-primary/90",
      text: "text-primary-foreground",
      border: "border-primary",
      bgForeground: "bg-primary",
      badge: "text-primary-foreground bg-primary border-primary",
      textCard: "text-primary",
      bgCardIcon: "bg-primary",
      borderCard: "border-primary",
      alert: "text-primary-foreground bg-primary border-primary/50",
    },
    success: {
      bg: "bg-success hover:bg-success/90",
      text: "text-success-foreground",
      border: "border-success",
      bgForeground: "bg-success",
      badge: "text-success-foreground bg-success border-success",
      textCard: "text-success",
      bgCardIcon: "bg-success",
      borderCard: "border-success",
      alert: "text-success-foreground bg-success border-success/50",
    },
    destructive: {
      bg: "bg-destructive hover:bg-destructive/90",
      text: "text-destructive-foreground",
      border: "border-destructive",
      bgForeground: "bg-destructive",
      badge: "text-destructive-foreground bg-destructive border-destructive",
      textCard: "text-destructive",
      bgCardIcon: "bg-destructive",
      borderCard: "border-destructive",
      alert: "text-destructive-foreground bg-destructive border-destructive/50",
    },
    warning: {
      bg: "bg-warning hover:bg-warning/90",
      text: "text-warning-foreground",
      border: "border-warning",
      bgForeground: "bg-warning",
      badge: "text-warning-foreground bg-warning border-warning",
      textCard: "text-warning",
      bgCardIcon: "bg-warning",
      borderCard: "border-warning",
      alert: "text-warning-foreground bg-warning border-warning/50",
    },
    info: {
      bg: "bg-info hover:bg-info/90",
      text: "text-info-foreground",
      border: "border-info",
      bgForeground: "bg-info",
      badge: "text-info-foreground bg-info border-info",
      textCard: "text-info",
      bgCardIcon: "bg-info",
      borderCard: "border-info",
      alert: "text-info-foreground bg-info border-info/50",
    },
    secondary: {
      bg: "bg-secondary hover:bg-secondary/80",
      text: "text-secondary-foreground",
      border: "border-border",
      bgForeground: "bg-muted-foreground",
      badge: "text-secondary-foreground bg-secondary border-border",
      textCard: "text-muted-foreground",
      bgCardIcon: "bg-muted",
      borderCard: "border-border",
      alert: "text-secondary-foreground bg-secondary border-border",
    },
    indigo: {
      bg: "bg-indigo hover:bg-indigo/90",
      text: "text-indigo-foreground",
      border: "border-indigo",
      bgForeground: "bg-indigo",
      badge: "text-indigo-foreground bg-indigo border-indigo",
      textCard: "text-indigo",
      bgCardIcon: "bg-indigo",
      borderCard: "border-indigo",
      alert: "text-indigo-foreground bg-indigo border-indigo/50",
    },
  },
  soft: {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-transparent",
      bgForeground: "bg-primary",
      badge: "text-primary bg-primary/10 border-primary/10",
      textCard: "text-primary",
      bgCardIcon: "bg-primary",
      borderCard: "border-primary",
      alert: "text-primary bg-primary/10 border-primary/20",
    },
    success: {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-transparent",
      bgForeground: "bg-success",
      badge: "text-success bg-success/10 border-success/10",
      textCard: "text-success",
      bgCardIcon: "bg-success",
      borderCard: "border-success",
      alert: "text-success bg-success/10 border-success/20",
    },
    destructive: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-transparent",
      bgForeground: "bg-destructive",
      badge: "text-destructive bg-destructive/10 border-destructive/10",
      textCard: "text-destructive",
      bgCardIcon: "bg-destructive",
      borderCard: "border-destructive",
      alert: "text-destructive bg-destructive/10 border-destructive/20",
    },
    warning: {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-transparent",
      bgForeground: "bg-warning",
      badge: "text-warning bg-warning/10 border-warning/10",
      textCard: "text-warning",
      bgCardIcon: "bg-warning",
      borderCard: "border-warning",
      alert: "text-warning bg-warning/10 border-warning/20",
    },
    info: {
      bg: "bg-info/10",
      text: "text-info",
      border: "border-transparent",
      bgForeground: "bg-info",
      badge: "text-info bg-info/10 border-info/10",
      textCard: "text-info",
      bgCardIcon: "bg-info",
      borderCard: "border-info",
      alert: "text-info bg-info/10 border-info/20",
    },
    secondary: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-transparent",
      bgForeground: "bg-muted-foreground",
      badge: "text-muted-foreground bg-muted border-border",
      textCard: "text-muted-foreground",
      bgCardIcon: "bg-muted",
      borderCard: "border-border",
      alert: "text-muted-foreground bg-muted border-border",
    },
    indigo: {
      bg: "bg-indigo/10",
      text: "text-indigo",
      border: "border-transparent",
      bgForeground: "bg-indigo",
      badge: "text-indigo bg-indigo/10 border-indigo/10",
      textCard: "text-indigo",
      bgCardIcon: "bg-indigo",
      borderCard: "border-indigo",
      alert: "text-indigo bg-indigo/10 border-indigo/20",
    },
  },
}

/** Type of IGRPColors object. */
export type IGRPColorType = typeof IGRPColors
/** Color role (outline, solid, soft). */
export type IGRPColorRole = keyof IGRPColorType
/** Color variant (primary, success, destructive, etc.). */
export type IGRPColorVariants = keyof IGRPColorType["solid"]
/** All color variant keys. */
export const IGRPColorObjectVariants = Object.keys(IGRPColors.solid) as IGRPColorVariants[]
/** All color role keys. */
export const IGRPColorObjectRole = Object.keys(IGRPColors) as IGRPColorRole[]

/**
 * Returns the text class for a color variant (solid style).
 */
export const igrpColorText = (value: IGRPColorVariants) => {
  return IGRPColors["solid"][value].text
}
