export type DesignTokens = {
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderStrong: string;
    brand: string;
    brandContrast: string;
    danger: string;
    success: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
  font: {
    sizes: {
      body: number;
      section: number;
      title: number;
    };
    weights: {
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
};

export declare const designTokens: DesignTokens;
export declare const cssVariables: Record<string, string>;
