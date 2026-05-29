import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { palette, borderRadius, spacing } from '../theme/theme';

type FilterOption = {
  key: string;
  label: string;
};

type FilterModalProps = {
  visible: boolean;
  value: string;
  options: FilterOption[];
  onSelect: (key: any) => void;
  onClose: () => void;
  title?: string;
};

export default function FilterModal({
  visible,
  value,
  options,
  onSelect,
  onClose,
  title = 'Filtrar por período',
}: FilterModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Header indicator bar */}
          <View style={styles.dragIndicator} />
          
          <Text style={styles.title}>{title}</Text>

          <View style={styles.optionsList}>
            {options.map((option) => {
              const isSelected = option.key === value;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.optionItem, isSelected && styles.optionItemActive]}
                  onPress={() => {
                    onSelect(option.key);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <MaterialIcons name="check" size={20} color={palette.navy800} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + 10,
    elevation: 24,
    shadowColor: palette.slate900,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.slate200,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  optionsList: {
    gap: spacing.xs,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: palette.slate50,
  },
  optionItemActive: {
    backgroundColor: palette.navy50,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slate500,
  },
  optionTextActive: {
    color: palette.navy800,
    fontWeight: '700',
  },
});
