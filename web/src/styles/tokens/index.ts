/**
 * Design Tokens Index
 * 
 * Central export point for all design tokens.
 * Import design tokens from this file to ensure consistency across the application.
 * 
 * Usage:
 * ```typescript
 * import { colors, spacing, typography, shadows } from '@/styles/tokens';
 * ```
 * 
 * Requirements: 1.1-1.9, 21.1-21.10, 23.1-23.7, 24.1-24.6
 */

export { colors } from './colors';
export type { ColorPalette } from './colors';

export { spacing, semanticSpacing } from './spacing';
export type { SpacingScale, SemanticSpacing } from './spacing';

export { typography, headings } from './typography';
export type { TypographySystem, HeadingScale } from './typography';

export { shadows, semanticShadows } from './shadows';
export type { ShadowSystem, SemanticShadows } from './shadows';

/**
 * Complete theme configuration combining all design tokens
 */
export const theme = {
  colors,
  spacing,
  typography,
  shadows,
} as const;

export type Theme = typeof theme;
