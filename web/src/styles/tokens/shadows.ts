/**
 * Shadow System Design Tokens
 * 
 * Defines shadow levels for depth and elevation effects.
 * Shadows create visual hierarchy and indicate interactive elements.
 * 
 * Requirements: 24.1-24.6
 */

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',      // Requirements: 24.2 (subtle elements)
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',      // Requirements: 24.3 (cards)
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',     // Requirements: 24.4 (elevated cards)
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',    // Requirements: 24.5 (modals)
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)', // Requirements: 24.6 (dropdowns)
  glow: '0 0 20px rgba(239, 35, 60, 0.3)',  // Crimson glow effect for hover states
  glowLarge: '0 0 40px rgba(239, 35, 60, 0.4)', // Larger glow for emphasis
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)', // Inner shadow for depth
} as const;

/**
 * Semantic shadow tokens for specific use cases
 */
export const semanticShadows = {
  card: shadows.md,           // Default card shadow
  cardHover: shadows.lg,      // Card shadow on hover
  modal: shadows.xl,          // Modal overlay shadow
  dropdown: shadows['2xl'],   // Dropdown menu shadow
  button: shadows.sm,         // Button shadow
  buttonHover: shadows.glow,  // Button glow on hover
} as const;

export type ShadowSystem = typeof shadows;
export type SemanticShadows = typeof semanticShadows;
