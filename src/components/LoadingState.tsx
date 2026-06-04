import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { borderRadius, palette, shadows, spacing } from '../theme/theme';

interface LoadingStateProps {
  message?: string;
  helper?: string;
  isFullPage?: boolean;
  style?: ViewStyle;
}

export default function LoadingState({
  message = 'Carregando dados...',
  helper = 'Buscando as informacoes da oficina.',
  isFullPage = false,
  style,
}: LoadingStateProps) {
  const card = (
    <View style={[styles.loadingCard, style]}>
      <ActivityIndicator size="large" color={palette.navy800} />
      <Text style={styles.loadingText}>{message}</Text>
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
    </View>
  );

  if (isFullPage) {
    return <View style={styles.fullPageContainer}>{card}</View>;
  }

  return card;
}

const styles = StyleSheet.create({
  fullPageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingBottom: 80,
  },
  loadingCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  loadingText: {
    fontSize: 17,
    color: palette.slate700,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 23,
  },
  helperText: {
    fontSize: 14,
    color: palette.slate500,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: -4,
  },
});
