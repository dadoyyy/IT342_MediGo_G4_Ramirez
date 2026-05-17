/**
 * Color Palette Design Tokens
 * 
 * Defines the color system for the MediGo premium UI redesign.
 * Colors are organized into primary, secondary, text, glass, and utility categories.
 * 
 * Requirements: 1.1-1.9
 */

export const colors = {
  primary: {
    navy: '#2B2D42',
    crimson: '#EF233C',
    ruby: '#D90429',
  },
  secondary: {
    slate: '#8D99AE',
    mist: '#EDF2F4',
  },
  text: {
    primary: '#2B2D42',
    secondary: '#6B7280',
    onDark: '#EDF2F4',
  },
  glass: {
    white: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(255, 255, 255, 0.2)',
  },
  backdrop: 'rgba(0, 0, 0, 0.5)',
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF233C',
    info: '#3B82F6',
  },
  hover: {
    crimson: 'rgba(239, 35, 60, 0.1)',
    slate: 'rgba(141, 153, 174, 0.1)',
  },
} as const;

export type ColorPalette = typeof colors;
