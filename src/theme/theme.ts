import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1565C0',
    primaryContainer: '#BBDEFB',
    secondary: '#FF6F00',
    secondaryContainer: '#FFE0B2',
    surface: '#FFFFFF',
    background: '#F5F7FA',
    surfaceVariant: '#EEF2F7',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A1A2E',
    onSurface: '#1A1A2E',
    outline: '#C5CAD6',
    error: '#D32F2F',
    success: '#2E7D32',
    warning: '#ED6C02',
  },
};

export const colors = theme.colors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};
