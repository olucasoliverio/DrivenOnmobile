import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import dayjs from 'dayjs';

type NotificationType = 'agenda' | 'financeiro' | 'estoque' | 'ordens' | 'orcamentos';
type SeverityType = 'info' | 'success' | 'warning' | 'danger';

const SEVERITY_CONFIG: Record<
  SeverityType,
  { bg: string; border: string; iconColor: string; label: string }
> = {
  danger: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    iconColor: '#EF4444',
    label: 'Crítico',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    iconColor: '#F59E0B',
    label: 'Alerta',
  },
  info: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    iconColor: '#2563EB',
    label: 'Info',
  },
  success: {
    bg: '#F0FDF4',
    border: '#A7F3D0',
    iconColor: '#10B981',
    label: 'Sucesso',
  },
};

const TYPE_ICONS: Record<NotificationType, keyof typeof MaterialIcons.glyphMap> = {
  agenda: 'event',
  financeiro: 'payments',
  estoque: 'inventory',
  ordens: 'build',
  orcamentos: 'request-quote',
};

export default function NotificacoesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { notificacoes, readNotificationIds, markAsRead, markAllAsRead, refresh } = useDriveOnData();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handlePressNotification = (item: any) => {
    // Marca como lida ao clicar
    void markAsRead(item.id);
    
    const { tipo, rota } = item;

    if (tipo === 'agenda') {
      navigation.navigate('Agenda');
    } else if (tipo === 'financeiro') {
      navigation.navigate('Financeiro');
    } else if (tipo === 'orcamentos') {
      navigation.navigate('Orcamentos');
    } else if (tipo === 'ordens') {
      const match = rota.match(/\/ordens\/(\d+)/);
      if (match && match[1]) {
        navigation.navigate('OSDetalhes', { osId: Number(match[1]) });
      } else {
        navigation.navigate('OS');
      }
    }
  };

  const hasUnread = notificacoes.some((n) => !readNotificationIds.includes(n.id));

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notificações"
        showBack={true}
        rightElement={
          hasUnread ? (
            <TouchableOpacity
              onPress={markAllAsRead}
              activeOpacity={0.7}
              style={styles.headerRightBtn}
            >
              <MaterialIcons name="done-all" size={20} color={palette.navy800} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[palette.navy800]}
          />
        }
        ListEmptyComponent={() => (
          <EmptyState
            icon="notifications-none"
            message="Você não tem nenhuma notificação ativa no momento."
            isFullPage
          />
        )}
        renderItem={({ item }) => {
          const isRead = readNotificationIds.includes(item.id);
          const sev = SEVERITY_CONFIG[item.severidade as SeverityType] ?? SEVERITY_CONFIG.info;
          const icon = TYPE_ICONS[item.tipo as NotificationType] ?? 'notifications';

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handlePressNotification(item)}
              style={[
                styles.card,
                isRead
                  ? styles.cardRead
                  : {
                      backgroundColor: sev.bg,
                      borderColor: sev.border,
                    },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: palette.white }]}>
                <MaterialIcons
                  name={icon}
                  size={22}
                  color={isRead ? palette.slate400 : sev.iconColor}
                />
              </View>

              <View style={styles.content}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    {!isRead && <View style={styles.unreadDot} />}
                    <Text
                      style={[
                        styles.title,
                        { color: isRead ? palette.slate500 : palette.slate900 },
                      ]}
                      numberOfLines={1}
                    >
                      {item.titulo}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>
                    {dayjs(item.createdAt).format('DD/MM [às] HH:mm')}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.description,
                    isRead && { color: palette.slate400 },
                  ]}
                  numberOfLines={2}
                >
                  {item.descricao}
                </Text>
              </View>

              {!isRead ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation();
                    void markAsRead(item.id);
                  }}
                  style={styles.markReadBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="check" size={20} color={palette.slate400} />
                </TouchableOpacity>
              ) : (
                <MaterialIcons name="chevron-right" size={20} color={palette.slate300} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.slate100,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  cardRead: {
    backgroundColor: palette.white,
    borderColor: palette.slate200,
    opacity: 0.65,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.sm,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.navy800,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  timeText: {
    fontSize: 10,
    color: palette.slate400,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: palette.slate500,
    lineHeight: 16,
  },
  markReadBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
