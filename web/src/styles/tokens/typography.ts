/**
 * Typography System Design Tokens
 * 
 * Defines font families, sizes, weights, and line heights for consistent typography.
 * Uses modern sans-serif fonts with fallbacks for optimal readability.
 * 
 * Requirements: 21.1-21.10
 */

export const typography = {
  fontFamily: {
    primary: 'Inter, system-ui, sans-serif',
    fallback: 'Satoshi, General Sans, Manrope, sans-serif',
  },
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    '4xl': '2.5rem', // 40px - Requirements: 21.2 (h1)
  },
  fontWeight: {
    normal: 400,     // Requirements: 21.4 (body text)
    medium: 500,     // Requirements: 21.5 (emphasized text)
    semibold: 600,   // Requirements: 21.3 (headings)
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,      // Requirements: 21.7 (headings)
    normal: 1.5,     // Requirements: 21.6 (body text)
    relaxed: 1.75,
  },
} as const;

/**
 * Heading scale definitions
 * Requirements: 21.2, 21.3, 21.7
 */
export const headings = {
  h1: {
    fontSize: typography.fontSize['4xl'], // 2.5rem (40px)
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
  h2: {
    fontSize: typography.fontSize['3xl'], // 2rem (32px)
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize['2xl'], // 1.5rem (24px)
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
  h4: {
    fontSize: typography.fontSize.xl, // 1.25rem (20px)
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
  h5: {
    fontSize: typography.fontSize.lg, // 1.125rem (18px)
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
  h6: {
    fontSize: typography.fontSize.base, // 1rem (16px)
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
} as const;

export type TypographySystem = typeof typography;
export type HeadingScale = typeof headings;
