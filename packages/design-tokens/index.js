const designTokens = {
  colors: {
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceMuted: "#f1f5f9",
    textPrimary: "#0f172a",
    textSecondary: "#334155",
    textMuted: "#64748b",
    border: "#cbd5e1",
    borderStrong: "#94a3b8",
    brand: "#2563eb",
    brandContrast: "#ffffff",
    danger: "#b91c1c",
    success: "#166534",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
  },
  font: {
    sizes: {
      body: 16,
      section: 18,
      title: 24,
    },
    weights: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
};

const cssVariables = {
  "--color-background": designTokens.colors.background,
  "--color-surface": designTokens.colors.surface,
  "--color-surface-muted": designTokens.colors.surfaceMuted,
  "--color-text-primary": designTokens.colors.textPrimary,
  "--color-text-secondary": designTokens.colors.textSecondary,
  "--color-text-muted": designTokens.colors.textMuted,
  "--color-border": designTokens.colors.border,
  "--color-border-strong": designTokens.colors.borderStrong,
  "--color-brand": designTokens.colors.brand,
  "--color-brand-contrast": designTokens.colors.brandContrast,
  "--color-danger": designTokens.colors.danger,
  "--color-success": designTokens.colors.success,
  "--space-xs": `${designTokens.spacing.xs}px`,
  "--space-sm": `${designTokens.spacing.sm}px`,
  "--space-md": `${designTokens.spacing.md}px`,
  "--space-lg": `${designTokens.spacing.lg}px`,
  "--space-xl": `${designTokens.spacing.xl}px`,
  "--radius-sm": `${designTokens.radius.sm}px`,
  "--radius-md": `${designTokens.radius.md}px`,
  "--radius-lg": `${designTokens.radius.lg}px`,
  "--font-body": `${designTokens.font.sizes.body}px`,
  "--font-section": `${designTokens.font.sizes.section}px`,
  "--font-title": `${designTokens.font.sizes.title}px`,
};

module.exports = {
  designTokens,
  cssVariables,
};
