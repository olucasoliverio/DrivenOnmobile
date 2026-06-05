import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { palette, spacing, borderRadius, shadows } from '../theme/theme';

export default function ProcessingOverlay({
  visible,
  message = 'Processando solicitação...',
}: {
  visible: boolean;
  message?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={palette.navy800} />
          <Text style={styles.text}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.lg,
  },
  text: {
    color: palette.slate700,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});
