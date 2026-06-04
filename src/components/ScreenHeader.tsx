/**
 * ScreenHeader — componente de header reutilizável estilo Nubank/fintech premium.
 *
 * Visual: fundo branco puro, título grande em bold, subtítulo opcional,
 * botão de voltar arredondado, separador suave (sem gradiente pesado).
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing, shadows } from '../theme/theme';

interface ScreenHeaderProps {
  /** Título principal (grande) */
  title: string;
  /** Subtítulo opcional abaixo do título */
  subtitle?: string;
  /** Mostrar botão de voltar (padrão: false) */
  showBack?: boolean;
  onBack?: () => void;
  /** Elemento extra no canto direito */
  rightElement?: React.ReactNode;
  /** Cor de fundo (padrão: branco) */
  backgroundColor?: string;
}

export default function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightElement,
  backgroundColor = palette.white,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {/* Botão voltar */}
        {showBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack ?? (() => navigation.goBack())}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={palette.slate700} />
          </TouchableOpacity>
        )}

        {/* Títulos */}
        <View style={[styles.textBlock, !showBack && { paddingLeft: 0 }]}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>

        {/* Elemento direito */}
        {rightElement && (
          <View style={styles.rightBlock}>
            {rightElement}
          </View>
        )}
      </View>

      {/* Linha divisória muito suave */}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 6,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
    // Sombra discreta para separar do conteúdo
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.06)',
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
    paddingLeft: spacing.xs,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.slate900,
    letterSpacing: -0.8,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 12,
    color: palette.slate500,
    fontWeight: '600',
    textAlign: 'left',
  },
  rightBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  divider: {
    // A borda do container já faz o trabalho; esse é apenas visual backup
    height: 0,
  },
});
