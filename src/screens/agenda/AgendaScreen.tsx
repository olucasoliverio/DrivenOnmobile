import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { FAB, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import EmptyState from '../../components/EmptyState';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import ScreenHeader from '../../components/ScreenHeader';
dayjs.locale('pt-br');

const { width } = Dimensions.get('window');

type AgendaDateFilter = 'dia' | 'hoje' | 'amanha' | 'semana' | 'mes';


function getDaysOfWeek(baseDate: dayjs.Dayjs) {
  const days = [];
  for (let i = -1; i <= 5; i++) {
    days.push(baseDate.add(i, 'day'));
  }
  return days;
}

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { agendamentos, clientes, veiculos, deleteRecord, refresh } = useDriveOnData();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dateFilter, setDateFilter] = useState<AgendaDateFilter>('hoje');
  const [refreshing, setRefreshing] = useState(false);

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
  const days = getDaysOfWeek(selectedDate);

  const agendamentosFiltrados = agendamentos.filter(a => {
    const date = dayjs(a.data);
    if (dateFilter === 'semana') return date.isSame(selectedDate, 'week');
    if (dateFilter === 'mes') return date.isSame(selectedDate, 'month');
    return date.isSame(selectedDate, 'day');
  }).sort((a, b) => dayjs(a.data).valueOf() - dayjs(b.data).valueOf());


  const remove = (id: number) => {
    Alert.alert('Remover agendamento?', 'Essa acao cancela o registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/agendamentos', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Agenda" showBack={true} />


      {/* ── Week Header com fundo claro ── */}
      <View style={styles.weekHeader}>
        <Text style={styles.mesAno}>
          {dateFilter === 'semana'
            ? `${selectedDate.startOf('week').format('DD/MM')} - ${selectedDate.endOf('week').format('DD/MM')}`
            : selectedDate.format('MMMM YYYY').replace(/^\w/, c => c.toUpperCase())}
        </Text>
        <FlatList
          horizontal
          data={days}
          keyExtractor={d => d.toISOString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
          renderItem={({ item: day }) => {
            const isSelected = day.isSame(selectedDate, 'day');
            const isToday = day.isSame(dayjs(), 'day');
            const temAg = agendamentos.some(a => dayjs(a.data).isSame(day, 'day'));
            return (
              <TouchableOpacity
                style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                onPress={() => {
                  setSelectedDate(day);
                  setDateFilter(
                    day.isSame(dayjs(), 'day')
                      ? 'hoje'
                      : day.isSame(dayjs().add(1, 'day'), 'day')
                      ? 'amanha'
                      : 'dia'
                  );
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayName, isSelected && styles.dayTextSelected, !isSelected && isToday && styles.dayNameToday]}>
                  {day.format('ddd').replace('.', '').substring(0, 3).toUpperCase()}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayTextSelected, !isSelected && isToday && styles.dayNumToday]}>
                  {day.format('D')}
                </Text>
                {temAg && (
                  <View style={[styles.dot, isSelected ? styles.dotSelected : styles.dotDefault]} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── Contador do dia ── */}
      {agendamentosFiltrados.length > 0 && (
        <View style={styles.dayInfoBar}>
          <Text style={styles.dayInfoText}>
            {`${agendamentosFiltrados.length} agendamento${agendamentosFiltrados.length > 1 ? 's' : ''}`}
          </Text>
        </View>
      )}

      {/* ── Lista de agendamentos ── */}
      <FlatList
        data={agendamentosFiltrados}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[palette.navy800]} />
        }
        ListEmptyComponent={() => (
          <EmptyState icon="event-available" message="Nenhum agendamento no período" isFullPage />
        )}
        renderItem={({ item }) => {
          const cliente = clientes.find(c => c.id === item.clienteId);
          const veiculo = veiculos.find(v => v.id === item.veiculoId);
          const isConfirmado = item.status === 'confirmado';
          return (
            <TouchableOpacity onPress={() => navigation.navigate('AgendaDetalhes', { agendamentoId: item.id })} activeOpacity={0.8}>
            <View style={styles.card}>
              {/* Barra lateral colorida */}
              <LinearGradient
                colors={isConfirmado ? gradients.navyPrimary : gradients.amber}
                style={styles.colorBar}
              />
              <View style={styles.cardBody}>
                {/* Linha superior: hora + badge */}
                <View style={styles.cardTop}>
                  <View style={styles.horaBox}>
                    <MaterialIcons name="schedule" size={13} color={palette.slate400} />
                    <Text style={styles.hora}>{item.hora}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isConfirmado ? palette.emerald100 : palette.amber100 }]}>
                    <Text style={[styles.badgeText, { color: isConfirmado ? palette.emerald600 : '#92400E' }]}>
                      {isConfirmado ? 'CONFIRMADO' : 'PENDENTE'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.clienteName}>{cliente?.nome}</Text>

                {veiculo && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="directions-car" size={13} color={palette.slate400} />
                    <Text style={styles.infoText}>
                      {veiculo.marca} {veiculo.modelo} · {veiculo.placa}
                    </Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <MaterialIcons name="build" size={13} color={palette.slate400} />
                  <Text style={styles.infoText}>{item.servico}</Text>
                </View>

                {item.observacao && (
                  <View style={[styles.infoRow, styles.obsRow]}>
                    <MaterialIcons name="notes" size={13} color={palette.slate400} />
                    <Text style={styles.obsText}>{item.observacao}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actionButtons}>
                <IconButton
                  icon="pencil-outline"
                  size={20}
                  iconColor={palette.navy800}
                  onPress={(event) => {
                    event.stopPropagation();
                    navigation.navigate('AgendaForm', { agendamentoId: item.id });
                  }}
                />
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor="#D32F2F"
                  onPress={(event) => {
                    event.stopPropagation();
                    remove(item.id);
                  }}
                />
              </View>
            </View>
            </TouchableOpacity>
          );
        }}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color={palette.white}
        onPress={() => navigation.navigate('AgendaForm')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  // Week header
  weekHeader: { 
    backgroundColor: palette.white,
    paddingBottom: spacing.md, 
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
  },
  mesAno: { fontSize: 16, fontWeight: '700', color: palette.slate500, textAlign: 'center', marginBottom: spacing.sm, textTransform: 'capitalize', letterSpacing: 0.5 },
  daysRow: { paddingHorizontal: spacing.md, gap: 8, paddingBottom: 4 },
  dayBtn: { width: 54, height: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: palette.slate100 },
  dayBtnSelected: { backgroundColor: palette.navy800 },
  dayName: { fontSize: 11, fontWeight: '600', color: palette.slate500 },
  dayNameToday: { color: palette.navy800, fontWeight: '700' },
  dayNum: { fontSize: 22, fontWeight: '800', color: palette.slate700 },
  dayNumToday: { color: palette.navy800, fontWeight: '900' },
  dayTextSelected: { color: palette.white },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotDefault: { backgroundColor: palette.amber500 },
  dotSelected: { backgroundColor: palette.white },

  // Info bar
  dayInfoBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  dayInfoText: { fontSize: 12, fontWeight: '600', color: palette.slate500 },

  // List
  listContent: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: 100 },

  // Card
  card: { backgroundColor: palette.white, borderRadius: borderRadius.lg, flexDirection: 'row', overflow: 'hidden', ...shadows.sm },
  colorBar: { width: 5 },
  cardBody: { flex: 1, padding: spacing.md },
  actionButtons: { justifyContent: 'center', marginRight: -4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  horaBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hora: { fontSize: 16, fontWeight: '800', color: palette.slate900 },
  badge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  clienteName: { fontSize: 15, fontWeight: '700', color: palette.slate900, marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoText: { fontSize: 12, color: palette.slate500, flex: 1 },
  obsRow: { marginTop: 6, padding: spacing.sm, backgroundColor: palette.slate50, borderRadius: borderRadius.sm },
  obsText: { fontSize: 12, color: palette.slate500, fontStyle: 'italic', flex: 1 },

  // Empty
  empty: { alignItems: 'center', marginTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: palette.slate700 },
  emptyText: { fontSize: 14, color: palette.slate400 },

  // FAB
  fab: { 
    position: 'absolute', 
    bottom: 24, 
    right: 20, 
    backgroundColor: palette.navy800,
    borderRadius: borderRadius.lg,
    ...shadows.lg
  },
});
