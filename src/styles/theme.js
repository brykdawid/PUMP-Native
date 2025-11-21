/**
 * Scentralizowany system motywu aplikacji PUMP
 * Zawiera definicje kolorów, gradientów i stylów u|ywanych w caBej aplikacji
 */

export const colors = {
  primary: {
    main: '#9333ea',
    dark: '#7c3aed',
    darker: '#6d28d9',
    light: '#a855f7',
  },
  success: {
    main: '#16a34a',
    dark: '#15803d',
    light: '#10b981',
  },
  danger: {
    main: '#ef4444',
    dark: '#dc2626',
    light: '#f87171',
  },
  warning: {
    main: '#ea580c',
    dark: '#c2410c',
    light: '#fb923c',
  },
  info: {
    main: '#0891b2',
    dark: '#0e7490',
    light: '#06b6d4',
  },
  neutral: {
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
  },
};

export const gradients = {
  // GBówny gradient motywu aplikacji (fioletowy)
  primary: ['#9333ea', '#7c3aed'],
  primaryDiagonal: ['#9333ea', '#7c3aed', '#6d28d9'],

  // Gradient sukcesu (zielony)
  success: ['#16a34a', '#15803d'],

  // Gradient niebezpieczeDstwa (czerwony)
  danger: ['#ef4444', '#dc2626'],

  // Gradient ostrze|enia (pomaraDczowy)
  warning: ['#ea580c', '#c2410c'],

  // Gradient informacyjny (niebieski)
  info: ['#0891b2', '#0e7490'],

  // Gradient ciemny
  dark: ['#1f2937', '#111827'],

  // Gradient jasny (dla przycisków pauzy itp.)
  light: ['#f3e8ff', '#fce7f3'],

  // Gradient profilowy (ró|owo-fioletowy)
  profile: ['#a855f7', '#ec4899'],
};

// Kierunki gradientów
export const gradientDirections = {
  vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  diagonalReverse: { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
};

// Rozmiary ikon
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export default {
  colors,
  gradients,
  gradientDirections,
  iconSizes,
  spacing,
  borderRadius,
};
