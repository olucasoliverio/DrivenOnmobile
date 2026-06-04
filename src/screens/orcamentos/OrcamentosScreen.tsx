import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Surface, FAB, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, palette, shadows } from '../../theme/theme';
import dayjs from 'dayjs';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import { sendEstimateMessage } from '../../services/whatsappService';
import AdvancedFilterModal from '../../components/AdvancedFilterModal';

type OrcamentoDateFilter = 'todos' | 'mes' | 'semana' | 'hoje' | 'vencidos' | 'personalizado';


function isWithinCustomRange(value: string, start: string, end: string) {
  const date = dayjs(value);
  const startDate = start ? dayjs(start) : null;
  const endDate = end ? dayjs(end) : null;
  if (startDate?.isValid() && date.isBefore(startDate, 'day')) return false;
  if (endDate?.isValid() && date.isAfter(endDate, 'day')) return false;
  return true;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: keyof typeof MaterialIcons.glyphMap; barColor: string }> = {
  aprovado: { label: 'Aprovado', color: palette.emerald600, bg: '#ECFDF5', icon: 'check-circle', barColor: palette.emerald600 },
  analise:  { label: 'Em análise', color: palette.amber500, bg: '#FFFBEB', icon: 'schedule', barColor: palette.amber500 },
  recusado: { label: 'Recusado', color: palette.rose600, bg: '#FFE4E6', icon: 'cancel', barColor: palette.rose600 },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig[status] ?? { label: status, color: palette.slate500, bg: palette.slate100, icon: 'info' as any, barColor: palette.slate400 };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <MaterialIcons name={s.icon} size={11} color={s.color} />
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const fields: CrudField[] = [
  { key: 'clienteId', label: 'Cliente', keyboardType: 'number-pad' },
  { key: 'veiculoId', label: 'Veículo', keyboardType: 'number-pad' },
  { key: 'descricao', label: 'Descricao', multiline: true },
  { key: 'valor', label: 'Valor', keyboardType: 'decimal-pad' },
  { key: 'data', label: 'Data (YYYY-MM-DD)' },
];

export default function OrcamentosScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orcamentos: orcamentosData, clientes, veiculos, deleteRecord, refresh, isLoading } = useDriveOnData();
  const { can } = useAuth();
  const [filtro, setFiltro] = useState<'todos' | 'aprovado' | 'analise' | 'recusado'>('todos');
  const [filtroData, setFiltroData] = useState<OrcamentoDateFilter>('mes');
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
      vencidos: 'Vencidos',
      personalizado: 'Personalizado',
    };
    const statusLabels: Record<string, string> = {
      todos: 'Todos',
      aprovado: 'Aprovado',
      analise: 'Em análise',
      recusado: 'Recusado',
    };

    let label = `Período: ${periodLabels[filtroData] ?? filtroData}`;
    if (filtroData === 'personalizado') {
      if (customStart || customEnd) {
        const startStr = customStart ? dayjs(customStart).format('DD/MM/YY') : '...';
        const endStr = customEnd ? dayjs(customEnd).format('DD/MM/YY') : '...';
        label = `Período: ${startStr} - ${endStr}`;
      }
    }
    return `${label} · Status: ${statusLabels[filtro] ?? filtro}`;
  };

  const orcamentos = orcamentosData.filter(o => {
    const matchStatus = filtro === 'todos' || o.status === filtro;
    const criacao = dayjs(o.dataCriacao);
    const validade = dayjs(o.validade);
    const matchData =
      filtroData === 'todos' ||
      (filtroData === 'mes' && criacao.isSame(dayjs(), 'month')) ||
      (filtroData === 'semana' && criacao.isSame(dayjs(), 'week')) ||
      (filtroData === 'hoje' && criacao.isSame(dayjs(), 'day')) ||
      (filtroData === 'vencidos' && o.status === 'analise' && validade.isBefore(dayjs(), 'day')) ||
      (filtroData === 'personalizado' && isWithinCustomRange(o.dataCriacao, customStart, customEnd));
    return matchStatus && matchData;
  });

  useEffect(() => {
    if (route.params?.openForm) {
      navigation.navigate('OrcamentoForm');
      navigation.setParams({ openForm: undefined });
    }
  }, [route.params?.openForm]);

  const remove = (id: number) => {
    Alert.alert('Remover orcamento?', 'Essa acao desativa o registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/orcamentos', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Orçamentos" showBack={true} />
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

      <FlatList
        data={orcamentos}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 100, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[palette.navy800]} />
        }
        ListEmptyComponent={() => (
          isLoading ? (
            <LoadingState message="Carregando orcamentos..." isFullPage />
          ) : (
            <EmptyState
              icon="description"
              message={filtro !== 'todos' ? `Nenhum orçamento ${filtro} encontrado` : 'Nenhum orçamento cadastrado'}
              helper={filtro !== 'todos' ? 'Altere os filtros para ver outros orçamentos.' : 'Crie um orçamento para apresentar valores ao cliente.'}
              actionLabel={filtro !== 'todos' || !can('orcamentos', 'create') ? undefined : 'Novo Orçamento'}
              onAction={filtro !== 'todos' || !can('orcamentos', 'create') ? undefined : () => navigation.navigate('OrcamentoForm')}
              isFullPage
            />
          )
        )}
        renderItem={({ item: o }) => {
          const cliente = clientes.find(c => c.id === o.clienteId);
          const veiculo = veiculos.find(v => v.id === o.veiculoId);
          const isVencido = dayjs(o.validade).isBefore(dayjs()) && o.status === 'analise';
          const barColor = (statusConfig[o.status] ?? statusConfig.analise).barColor;
          return (
            <TouchableOpacity onPress={() => navigation.navigate('OrcamentoDetalhes', { orcamentoId: o.id })} activeOpacity={0.7}>
              <View style={styles.card}>
                {/* Barra lateral por status */}
                <View style={[styles.cardBar, { backgroundColor: barColor }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.numBox}>
                      <Text style={styles.numText}>ORC #{String(o.id).padStart(3, '0')}</Text>
                    </View>
                    <StatusBadge status={o.status} />
                  </View>
                  <Text style={styles.clienteNome}>{cliente?.nome}</Text>
                  <Text style={styles.veiculoInfo}>
                    {veiculo ? `${veiculo.marca} ${veiculo.modelo} · ${veiculo.placa}` : ''}
                  </Text>
                  <View style={styles.itens}>
                    {o.itens.slice(0, 2).map((item: any, idx: number) => {
                      const qty = item.quantidade ?? item.qtd ?? 1;
                      const price = item.precoUnitario ?? item.valor ?? 0;
                      return (
                        <View key={idx} style={styles.itemRow}>
                          <Text style={styles.itemNome} numberOfLines={1}>{item.nome ?? item.descricao}</Text>
                          <Text style={styles.itemValor}>R$ {(qty * price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                        </View>
                      );
                    })}
                    {o.itens.length > 2 && <Text style={styles.maisItens}>+{o.itens.length - 2} item(ns)</Text>}
                  </View>
                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <MaterialIcons name="event" size={13} color={palette.slate400} />
                      <Text style={styles.footerText}>{dayjs(o.dataCriacao).format('DD/MM/YY')}</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <MaterialIcons name={isVencido ? 'warning' : 'schedule'} size={13} color={isVencido ? palette.rose600 : palette.slate400} />
                      <Text style={[styles.footerText, isVencido && { color: palette.rose600, fontWeight: '700' }]}>
                        {isVencido ? 'Vencido' : dayjs(o.validade).format('DD/MM/YY')}
                      </Text>
                    </View>
                    <Text style={styles.valorText}>R$ {o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      {can('orcamentos', 'create') && (
        <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => navigation.navigate('OrcamentoForm')} />
      )}
      <AdvancedFilterModal
        visible={filterModalVisible}
        periodValue={filtroData}
        periodOptions={[
          { key: 'mes', label: 'Este mês' },
          { key: 'semana', label: 'Esta semana' },
          { key: 'hoje', label: 'Hoje' },
          { key: 'vencidos', label: 'Vencidos' },
          { key: 'todos', label: 'Todos os períodos' },
          { key: 'personalizado', label: 'Personalizado' },
        ]}
        statusValue={filtro}
        statusOptions={[
          { key: 'todos', label: 'Todos' },
          { key: 'aprovado', label: 'Aprovado' },
          { key: 'analise', label: 'Em análise' },
          { key: 'recusado', label: 'Recusado' },
        ]}
        customStart={customStart}
        customEnd={customEnd}
        onApply={(period, status, start, end) => {
          setFiltroData(period as OrcamentoDateFilter);
          setFiltro(status as any);
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
  card: { backgroundColor: palette.white, borderRadius: borderRadius.lg, flexDirection: 'row', overflow: 'hidden', ...shadows.sm },
  cardBar: { width: 5 },
  cardContent: { flex: 1, padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  numBox: { backgroundColor: palette.navy50, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  numText: { fontSize: 12, fontWeight: '700', color: palette.navy800 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  clienteNome: { fontSize: 15, fontWeight: '700', color: palette.slate900 },
  veiculoInfo: { fontSize: 12, color: palette.slate500, marginTop: 2, marginBottom: spacing.sm },
  itens: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: spacing.sm, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  itemNome: { fontSize: 12, color: '#757575', flex: 1 },
  itemValor: { fontSize: 12, color: palette.slate900, fontWeight: '600' },
  maisItens: { fontSize: 11, color: '#9E9E9E', fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: palette.slate100, gap: 4 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: palette.slate400 },
  valorText: { fontSize: 15, fontWeight: '800', color: palette.navy800 },
  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: colors.primary, borderRadius: 16, elevation: 8 },
});
