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
  /** Elemento extra no canto direito */
  rightElement?: React.ReactNode;
  /** Cor de fundo (padrão: branco) */
  backgroundColor?: string;
}

export default function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  rightElement,
  backgroundColor = palette.white,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: statusBarHeight + 12 }]}>
      <View style={styles.row}>
        {/* Botão voltar */}
        {showBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={palette.slate700} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {/* Títulos */}
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>

        {/* Elemento direito */}
        <View style={styles.rightBlock}>
          {rightElement ?? <View style={styles.backPlaceholder} />}
        </View>
      </View>

      {/* Linha divisória muito suave */}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
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
  backPlaceholder: {
    width: 44,
    height: 44,
  },
  textBlock: {
    flex: 1,
    gap: 2,
    paddingLeft: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.slate900,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 13,
    color: palette.slate500,
    fontWeight: '600',
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
