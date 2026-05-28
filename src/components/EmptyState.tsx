import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { palette, spacing, borderRadius, shadows } from '../theme/theme';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface EmptyStateProps {
  icon: IconName;
  message: string;
  isFullPage?: boolean;
  style?: ViewStyle;
}

export default function EmptyState({ icon, message, isFullPage = false, style }: EmptyStateProps) {
  const card = (
    <View style={[styles.emptyCard, style]}>
      <MaterialIcons name={icon} size={48} color={palette.slate300} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  if (isFullPage) {
    return (
      <View style={styles.fullPageContainer}>
        {card}
      </View>
    );
  }

  return card;
}

const styles = StyleSheet.create({
  fullPageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingBottom: 80, // Compensação visual para o menu inferior e botão FAB
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  emptyText: {
    fontSize: 16,
    color: palette.slate400,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
});
