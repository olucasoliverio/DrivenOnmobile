import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { palette, spacing, borderRadius, shadows } from '../theme/theme';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface EmptyStateProps {
  icon: IconName;
  message: string;
  helper?: string;
  actionLabel?: string;
  onAction?: () => void;
  isFullPage?: boolean;
  style?: ViewStyle;
}

export default function EmptyState({
  icon,
  message,
  helper,
  actionLabel,
  onAction,
  isFullPage = false,
  style,
}: EmptyStateProps) {
  const card = (
    <View style={[styles.emptyCard, style]}>
      <MaterialIcons name={icon} size={48} color={palette.slate300} />
      <Text style={styles.emptyText}>{message}</Text>
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
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
  actionButton: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.navy800,
    marginTop: spacing.sm,
  },
  actionButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
