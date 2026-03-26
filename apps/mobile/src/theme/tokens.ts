import { designTokens } from "@smn/design-tokens";

export const mobileTheme = {
  colors: designTokens.colors,
  spacing: designTokens.spacing,
  radius: designTokens.radius,
  font: {
    sizes: designTokens.font.sizes,
    weights: {
      regular: designTokens.font.weights.regular as "400",
      medium: designTokens.font.weights.medium as "500",
      semibold: designTokens.font.weights.semibold as "600",
      bold: designTokens.font.weights.bold as "700",
    },
  },
};
