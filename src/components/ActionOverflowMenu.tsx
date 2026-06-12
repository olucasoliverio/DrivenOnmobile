import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { palette, borderRadius, spacing, shadows } from '../theme/theme';

type IconName = keyof typeof MaterialIcons.glyphMap;

export type ActionOverflowOption = {
  label: string;
  icon: IconName;
  onPress: () => void;
  color?: string;
  destructive?: boolean;
  disabled?: boolean;
};

type ActionOverflowMenuProps = {
  options: ActionOverflowOption[];
  buttonColor?: string;
  accessibilityLabel?: string;
};

const MENU_WIDTH = 220;
const MENU_MARGIN = 12;
const OPTION_HEIGHT = 60;

export default function ActionOverflowMenu({
  options,
  buttonColor = palette.slate700,
  accessibilityLabel = 'Abrir ações',
}: ActionOverflowMenuProps) {
  const triggerRef = React.useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [visible, setVisible] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState({ top: 72, left: MENU_MARGIN });
  const enabledOptions = options.filter(option => !option.disabled);

  if (enabledOptions.length === 0) return null;

  const openMenu = () => {
    const estimatedHeight = enabledOptions.length * OPTION_HEIGHT + spacing.sm;

    triggerRef.current?.measureInWindow((x, y, width, height) => {
      const left = Math.min(
        Math.max(MENU_MARGIN, x + width - MENU_WIDTH),
        screenWidth - MENU_WIDTH - MENU_MARGIN,
      );
      const belowTop = y + height + spacing.xs;
      const aboveTop = y - estimatedHeight - spacing.xs;
      const top = belowTop + estimatedHeight <= screenHeight - MENU_MARGIN
        ? belowTop
        : Math.max(MENU_MARGIN, aboveTop);

      setMenuPosition({ top, left });
      setVisible(true);
    });
  };

  const handleSelect = (option: ActionOverflowOption) => {
    setVisible(false);
    requestAnimationFrame(option.onPress);
  };

  return (
    <>
      <TouchableOpacity
        ref={triggerRef}
        style={styles.trigger}
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={(event) => {
          event.stopPropagation?.();
          openMenu();
        }}
      >
        <MaterialIcons name="more-vert" size={22} color={buttonColor} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={[styles.menu, menuPosition]}>
            {enabledOptions.map(option => {
              const color = option.color ?? (option.destructive ? palette.rose600 : palette.slate700);
              return (
                <TouchableOpacity
                  key={option.label}
                  style={styles.option}
                  activeOpacity={0.72}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    handleSelect(option);
                  }}
                >
                  <View style={[styles.optionIconBox, option.destructive && styles.optionIconBoxDestructive]}>
                    <MaterialIcons name={option.icon} size={18} color={color} />
                  </View>
                  <Text style={[styles.optionText, { color }]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    paddingVertical: spacing.xs,
    ...shadows.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: OPTION_HEIGHT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.slate50,
  },
  optionIconBoxDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
