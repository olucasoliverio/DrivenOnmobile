import { MD3LightTheme } from 'react-native-paper';

// ─── Paleta Principal (Alinhada com o DriveOn WEB, refinada para mobile) ─────
export const palette = {
  navy900: '#0F172A', // Slate 900 (mais profundo e moderno que o anterior #18202F)
  navy800: '#2563EB', // Blue 600 (azul mais vivo e moderno)
  navy700: '#1D4ED8', // Blue 700
  navy600: '#3B82F6', // Blue 500
  navy500: '#60A5FA', // Blue 400
  navy100: '#DBEAFE', // Blue 100
  navy5:  '#F0FDF4',
  navy50:  '#EFF6FF',

  amber500: '#F59E0B', // Amber 500 (mais quente e moderno)
  amber400: '#FBBF24',
  amber100: '#FEF3C7',
  amber50:  '#FFFBEB',

  emerald600: '#10B981', // Emerald 500 (verde mais limpo)
  emerald100: '#D1FAE5',

  rose600: '#EF4444', // Red 500
  rose100: '#FFE4E6',

  violet600: '#8B5CF6', // Violet 500
  violet100: '#EDE9FE',

  slate900: '#0F172A',
  slate700: '#334155',
  slate500: '#64748B', // brand.muted
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0', // brand.line
  slate100: '#F1F5F9', // brand.page (cinza mais moderno que o antigo #F5F7FA)
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

// ─── Border Radius (Arredondamento mais moderno/suave) ──────────────────────────
export const borderRadius = {
  sm: 8,   // Cantos ligeiramente mais redondos
  md: 12,  // Padrão para cards pequenos/inputs
  lg: 16,  // Padrão para cards grandes
  xl: 24,  // Padrão para modais e cartões principais
  full: 999,
};

// ─── Sombras Neutras (Muito mais suaves e difusas, visual premium) ──────────
export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ─── Gradientes (Alinhados com o Web) ───────────────────────────────────────
export const gradients = {
  navyPrimary: [palette.navy800, palette.navy700] as [string, string], 
  navyDark:    [palette.navy900, '#1E293B'] as [string, string], // Slate 900 para Slate 800 (transição muito elegante)
  amber:       [palette.amber500, palette.amber400] as [string, string],
  surface:     [palette.white, palette.slate50] as [string, string],
};

