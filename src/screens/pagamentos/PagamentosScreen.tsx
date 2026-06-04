import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { useAuth } from '../../context/AuthContext';
import { spacing, borderRadius, palette, shadows } from '../../theme/theme';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import ScreenHeader from '../../components/ScreenHeader';
import CalendarDatePicker from '../../components/CalendarDatePicker';
import AdvancedFilterModal from '../../components/AdvancedFilterModal';


type Tab = 'todos' | 'pendente' | 'recebido';
type DateFilter = 'todos' | 'mes' | 'semana' | 'hoje' | 'vencidas' | 'personalizado';


function isWithinCustomRange(value: string, start: string, end: string) {
  const date = dayjs(value);
  const startDate = start ? dayjs(start) : null;
  const endDate = end ? dayjs(end) : null;
  if (startDate?.isValid() && date.isBefore(startDate, 'day')) return false;
  if (endDate?.isValid() && date.isAfter(endDate, 'day')) return false;
  return true;
}

export default function PagamentosScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { pagamentos, deleteRecord, refresh, isLoading } = useDriveOnData();
  const { can } = useAuth();
  const [tab, setTab] = useState<Tab>('todos');
  const [dateFilter, setDateFilter] = useState<DateFilter>('mes');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
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

  const getActiveFilterLabel = () => {
    const periodLabels: Record<string, string> = {
      todos: 'Todos os períodos',
      mes: 'Este mês',
      semana: 'Esta semana',
      hoje: 'Hoje',
      vencidas: 'Vencidas',
      personalizado: 'Personalizado',
    };
    const statusLabels: Record<string, string> = {
      todos: 'Todos',
      pendente: 'Pendentes',
      recebido: 'Recebidas',
    };

    let label = `Período: ${periodLabels[dateFilter] ?? dateFilter}`;
    if (dateFilter === 'personalizado') {
      if (customStart || customEnd) {
        const startStr = customStart ? dayjs(customStart).format('DD/MM/YY') : '...';
        const endStr = customEnd ? dayjs(customEnd).format('DD/MM/YY') : '...';
        label = `Período: ${startStr} - ${endStr}`;
      }
    }
    return `${label} · Status: ${statusLabels[tab] ?? tab}`;
  };

  const contasReceber = pagamentos.filter(p => p.tipo === 'receber');
  const contasFiltradasPorData = contasReceber.filter(p => {
    const vencimento = dayjs(p.data);
    if (dateFilter === 'hoje') return vencimento.isSame(dayjs(), 'day');
    if (dateFilter === 'semana') return vencimento.isSame(dayjs(), 'week');
    if (dateFilter === 'mes') return vencimento.isSame(dayjs(), 'month');
    if (dateFilter === 'vencidas') return p.status === 'pendente' && vencimento.isBefore(dayjs(), 'day');
    if (dateFilter === 'personalizado') return isWithinCustomRange(p.data, customStart, customEnd);
    return true;
  });
  const dados = tab === 'todos'
    ? contasFiltradasPorData
    : contasFiltradasPorData.filter(p => p.status === (tab === 'recebido' ? 'pago' : 'pendente'));

  const total = contasFiltradasPorData.reduce((acc, p) => acc + p.valor, 0);
  const pendentes = contasFiltradasPorData.filter(p => p.status === 'pendente').reduce((acc, p) => acc + p.valor, 0);

  const remove = (id: number) => {
    Alert.alert('Remover pagamento?', 'Essa acao cancela o registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/pagamentos', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'recebido', label: 'Recebidas' },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Contas a Receber" showBack={true} />

      {/* Resumo */}
      <View style={styles.resumoContainer}>
        <View style={styles.resumoCard}>
          <View style={[styles.resumoIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
            <MaterialIcons name="account-balance-wallet" size={18} color={palette.emerald600} />
          </View>
          <View style={styles.resumoTexts}>
            <Text style={styles.resumoLabel}>Total a Receber</Text>
            <Text style={[styles.resumoValue, { color: palette.emerald600 }]}>
              {isLoading ? 'Carregando...' : `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </Text>
          </View>
        </View>

        <View style={styles.resumoCard}>
          <View style={[styles.resumoIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}>
            <MaterialIcons name="hourglass-empty" size={18} color={palette.amber500} />
          </View>
          <View style={styles.resumoTexts}>
            <Text style={styles.resumoLabel}>Em Aberto</Text>
            <Text style={[styles.resumoValue, { color: palette.amber500 }]}>
              {isLoading ? 'Carregando...' : `R$ ${pendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filterTriggerContainer}>
        <TouchableOpacity
          style={styles.filterTriggerBtn}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.filterTriggerLeft}>
            <MaterialIcons name="filter-list" size={18} color={palette.navy800} />
            <Text style={styles.filterTriggerValue}>{getActiveFilterLabel()}</Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={22} color={palette.slate500} />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={dados}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        style={styles.mainList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[palette.navy800]} />
        }
        ListEmptyComponent={() => (
          isLoading ? (
            <LoadingState message="Carregando contas..." isFullPage />
          ) : (
            <EmptyState
              icon="payment"
              message={
                tab === 'todos'
                  ? 'Nenhuma conta a receber'
                  : tab === 'pendente'
                  ? 'Nenhuma conta pendente'
                  : 'Nenhuma conta recebida'
              }
              helper={tab === 'todos' ? 'Cadastre uma conta para acompanhar os recebimentos.' : 'Altere os filtros para consultar outros recebimentos.'}
              actionLabel={tab === 'todos' && can('financeiro', 'create') ? 'Nova Conta' : undefined}
              onAction={tab === 'todos' && can('financeiro', 'create') ? () => navigation.navigate('PagamentoForm') : undefined}
              isFullPage
            />
          )
        )}
        renderItem={({ item: p }) => {
          const isPago = p.status === 'pago';
          return (
            <TouchableOpacity onPress={() => navigation.navigate('PagamentoDetalhes', { pagamentoId: p.id })} activeOpacity={0.8}>
              <View style={[styles.card, { borderLeftColor: palette.emerald600 }]}>
                <View style={styles.cardRow}>
                  {/* Icon Box */}
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                    <MaterialIcons 
                      name="arrow-downward"
                      size={20} 
                      color={palette.emerald600}
                    />
                  </View>

                  {/* Details */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.desc} numberOfLines={1}>
                      {p.descricao || 'Recebimento'}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <MaterialIcons name="event" size={12} color={palette.slate400} />
                        <Text style={styles.metaText}>{dayjs(p.data).format('DD/MM/YYYY')}</Text>
                      </View>
                      {p.formaPagamento ? (
                        <View style={styles.metaItem}>
                          <MaterialIcons name="credit-card" size={12} color={palette.slate400} />
                          <Text style={styles.metaText}>{p.formaPagamento.toUpperCase()}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Value and Status */}
                  <View style={{ alignItems: 'flex-end', marginRight: spacing.xs }}>
                    <Text style={[styles.valorText, { color: palette.emerald600 }]}>
                      + R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: isPago ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)' }]}>
                      <View style={[styles.statusDot, { backgroundColor: isPago ? palette.emerald600 : palette.amber500 }]} />
                      <Text style={[styles.statusText, { color: isPago ? palette.emerald600 : palette.amber500 }]}>
                        {isPago ? 'PAGO' : 'PENDENTE'}
                      </Text>
                    </View>
                  </View>

                  {(can('financeiro', 'update') || can('financeiro', 'delete')) && (
                    <View style={styles.actionButtons}>
                      {can('financeiro', 'update') && (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={(event) => {
                            event.stopPropagation();
                            navigation.navigate('PagamentoForm', { pagamentoId: p.id });
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <MaterialIcons name="edit" size={19} color={palette.navy800} />
                        </TouchableOpacity>
                      )}

                      {can('financeiro', 'delete') && (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={(event) => {
                            event.stopPropagation();
                            remove(p.id);
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <MaterialIcons name="delete-outline" size={20} color={palette.slate400} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      {can('financeiro', 'create') && (
        <FAB icon="plus" style={styles.fab} color={palette.white} onPress={() => navigation.navigate('PagamentoForm')} />
      )}
      <AdvancedFilterModal
        visible={filterModalVisible}
        periodValue={dateFilter}
        periodOptions={[
          { key: 'mes', label: 'Este mês' },
          { key: 'semana', label: 'Esta semana' },
          { key: 'hoje', label: 'Hoje' },
          { key: 'vencidas', label: 'Vencidas' },
          { key: 'todos', label: 'Todos os períodos' },
          { key: 'personalizado', label: 'Personalizado' },
        ]}
        statusValue={tab}
        statusOptions={[
          { key: 'todos', label: 'Todos' },
          { key: 'pendente', label: 'Pendentes' },
          { key: 'recebido', label: 'Recebidas' },
        ]}
        customStart={customStart}
        customEnd={customEnd}
        onApply={(period, status, start, end) => {
          setDateFilter(period as DateFilter);
          setTab(status as Tab);
          setCustomStart(start);
          setCustomEnd(end);
        }}
        onClose={() => setFilterModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },
  
  // Resumo Metric Cards
  resumoContainer: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.md },
  resumoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    gap: spacing.sm,
    ...shadows.sm,
  },
  resumoIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  resumoTexts: { flex: 1 },
  resumoLabel: { fontSize: 10, color: palette.slate400, fontWeight: '700' },
  resumoValue: { fontSize: 14, fontWeight: '900', marginTop: 1, letterSpacing: -0.2 },

  filterTriggerContainer: { paddingHorizontal: spacing.lg, marginVertical: spacing.md },
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    ...shadows.sm,
  },
  filterTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  filterTriggerValue: {
    fontSize: 13,
    color: palette.navy800,
    fontWeight: '800',
    flex: 1,
  },
  dateFilterContainer: { marginBottom: spacing.xs },
  dateFilterRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  dateChipActive: {
    backgroundColor: palette.navy50,
    borderColor: palette.navy800,
  },
  dateChipText: { fontSize: 12, fontWeight: '700', color: palette.slate500 },
  dateChipTextActive: { color: palette.navy800 },
  customRangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  customDateButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  customDateText: {
    flex: 1,
    color: palette.slate900,
    fontSize: 12,
    fontWeight: '600',
  },
  customDatePlaceholder: {
    color: palette.slate400,
  },

  // List
  mainList: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: 100, gap: spacing.sm },

  // Card list item
  card: { 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.md, 
    borderWidth: 1, 
    borderColor: 'rgba(15, 23, 42, 0.04)', 
    borderLeftWidth: 4, 
    overflow: 'hidden', 
    ...shadows.sm 
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  desc: { fontSize: 14, fontWeight: '700', color: palette.slate900, letterSpacing: -0.1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: palette.slate400, fontWeight: '600' },
  valorText: { fontSize: 14, fontWeight: '900', letterSpacing: -0.2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 3, gap: 4, marginTop: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 9, fontWeight: '800' },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionBtn: { padding: 4, justifyContent: 'center', alignItems: 'center' },
  fab: { 
    position: 'absolute', 
    bottom: 24, 
    right: 20, 
    backgroundColor: palette.navy800, 
    borderRadius: borderRadius.lg, 
    ...shadows.lg 
  },
});
