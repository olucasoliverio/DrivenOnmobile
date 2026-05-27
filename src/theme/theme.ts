import { MD3LightTheme } from 'react-native-paper';

// ─── Paleta Principal (Alinhada com o DriveOn WEB) ──────────────────────────
export const palette = {
  navy900: '#18202F', // brand.ink
  navy800: '#1D4ED8', // brand.primary
  navy700: '#173EA5', // brand.primaryDark
  navy600: '#2563EB',
  navy500: '#3B82F6',
  navy100: '#DBEAFE',
  navy5:  '#EFF6FF',
  navy50:  '#EFF6FF',

  amber500: '#D97706', // brand.amber
  amber400: '#FBBF24',
  amber100: '#FEF3C7',
  amber50:  '#FFFBEB',

  emerald600: '#059669',
  emerald100: '#D1FAE5',

  rose600: '#E11D48',
  rose100: '#FFE4E6',

  violet600: '#7C3AED',
  violet100: '#EDE9FE',

  slate900: '#18202F',
  slate700: '#475569',
  slate500: '#667085', // brand.muted
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#DDE3EA', // brand.line
  slate100: '#F5F7FA', // brand.page
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
  sm: 6, // Alinhado com o Web (borderRadius: 6/8)
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

// ─── Sombras Neutras (Alinhadas com o Web) ──────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ─── Gradientes (Alinhados com o Web) ───────────────────────────────────────
export const gradients = {
  navyPrimary: [palette.navy800, palette.navy700] as [string, string], // brand.primary para brand.primaryDark
  navyDark:    [palette.navy900, '#26354A'] as [string, string], // brand.ink para um tom um pouco mais claro
  amber:       [palette.amber500, palette.amber400] as [string, string],
  surface:     [palette.white, palette.slate50] as [string, string],
};
