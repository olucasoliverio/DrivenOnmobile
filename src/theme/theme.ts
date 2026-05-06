import { MD3LightTheme } from 'react-native-paper';

// ─── Paleta Principal ───────────────────────────────────────────────────────
export const palette = {
  navy900: '#0F1E3C',
  navy800: '#1E3A8A',
  navy700: '#1D4ED8',
  navy600: '#2563EB',
  navy500: '#3B82F6',
  navy100: '#DBEAFE',
  navy50:  '#EFF6FF',

  amber500: '#F59E0B',
  amber400: '#FBBF24',
  amber100: '#FEF3C7',
  amber50:  '#FFFBEB',

  emerald600: '#059669',
  emerald100: '#D1FAE5',

  rose600: '#E11D48',
  rose100: '#FFE4E6',

  violet600: '#7C3AED',
  violet100: '#EDE9FE',

  slate900: '#0F172A',
  slate700: '#334155',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50:  '#F8FAFC',

  white: '#FFFFFF',
};

// ─── Tema React Native Paper ────────────────────────────────────────────────
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.navy800,
    primaryContainer: palette.navy100,
    secondary: palette.amber500,
    secondaryContainer: palette.amber100,
    surface: palette.white,
    background: palette.slate100,
    surfaceVariant: palette.slate50,
    onPrimary: palette.white,
    onSecondary: palette.slate900,
    onBackground: palette.slate900,
    onSurface: palette.slate900,
    outline: palette.slate200,
    error: palette.rose600,
    success: palette.emerald600,
    warning: palette.amber500,
  },
};

export const colors = theme.colors;

// ─── Espaçamento ────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── Border Radius ──────────────────────────────────────────────────────────
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// ─── Sombras ────────────────────────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
};

// ─── Gradientes (para uso com LinearGradient) ───────────────────────────────
export const gradients = {
  navyPrimary: ['#1E3A8A', '#1D4ED8'] as [string, string],
  navyDark:    ['#0F1E3C', '#1E3A8A'] as [string, string],
  amber:       ['#F59E0B', '#FBBF24'] as [string, string],
  surface:     ['#FFFFFF', '#F8FAFC'] as [string, string],
};
