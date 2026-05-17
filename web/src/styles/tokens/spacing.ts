/**
 * Spacing Scale Design Tokens
 * 
 * Defines the spacing system for consistent padding, margins, and gaps.
 * Based on a 16px (1rem) base unit with a harmonious scale.
 * 
 * Requirements: 23.1-23.7
 */

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px - base unit
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const;

/**
 * Semantic spacing tokens for specific use cases
 */
export const semanticSpacing = {
  cardPadding: spacing.lg,        // 24px - Requirements: 23.3
  pagePadding: spacing.xl,        // 32px - Requirements: 23.4
  inlineGap: spacing.sm,          // 8px - Requirements: 23.5
  stackGap: spacing.md,           // 16px - Requirements: 23.6
  sectionGap: spacing.xl,         // 32px - Requirements: 23.7
} as const;

export type SpacingScale = typeof spacing;
export type SemanticSpacing = typeof semanticSpacing;
