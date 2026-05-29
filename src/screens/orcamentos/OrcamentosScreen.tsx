import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Surface, FAB, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius, palette, shadows } from '../../theme/theme';
import dayjs from 'dayjs';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
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

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  aprovado: { label: 'Aprovado', color: '#2E7D32', bg: '#E8F5E9' },
  pendente: { label: 'Pendente', color: '#E65100', bg: '#FFF3E0' },
  recusado: { label: 'Recusado', color: '#D32F2F', bg: '#FFEBEE' },
};

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
  const { orcamentos: orcamentosData, clientes, veiculos, deleteRecord, refresh } = useDriveOnData();
  const [filtro, setFiltro] = useState<'todos' | 'aprovado' | 'pendente' | 'recusado'>('todos');
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
      pendente: 'Pendente',
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
      (filtroData === 'vencidos' && o.status === 'pendente' && validade.isBefore(dayjs(), 'day')) ||
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
          <EmptyState
            icon="description"
            message={filtro !== 'todos' ? `Nenhum orçamento ${filtro} encontrado` : 'Nenhum orçamento cadastrado'}
            isFullPage
          />
        )}
        renderItem={({ item: o }) => {
          const cliente = clientes.find(c => c.id === o.clienteId);
          const veiculo = veiculos.find(v => v.id === o.veiculoId);
          const st = statusConfig[o.status] ?? { label: o.status, color: '#757575', bg: '#F5F5F5' };
          const isVencido = dayjs(o.validade).isBefore(dayjs()) && o.status === 'pendente';
          return (
            <TouchableOpacity onPress={() => navigation.navigate('OrcamentoDetalhes', { orcamentoId: o.id })} activeOpacity={0.8}>
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardHeader}>
                <Text style={styles.orcNum}>ORC #{String(o.id).padStart(3, '0')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {cliente?.telefone ? (
                    <IconButton
                      icon="whatsapp"
                      size={18}
                      iconColor="#25D366"
                      onPress={() => {
                        const veiculoNome = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : 'Veículo';
                        const firstItemDesc = o.itens?.[0]?.nome ?? 'Serviço da oficina';
                        sendEstimateMessage(
                          cliente.nome,
                          cliente.telefone,
                          o.id,
                          veiculoNome,
                          firstItemDesc,
                          o.total
                        );
                      }}
                    />
                  ) : null}
                  <IconButton icon="delete-outline" size={18} iconColor="#D32F2F" onPress={() => remove(o.id)} />
                </View>
                <View style={[styles.badge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              <Text style={styles.clienteNome}>{cliente?.nome}</Text>
              <Text style={styles.veiculoText}>{veiculo ? `${veiculo.marca} ${veiculo.modelo} • ${veiculo.placa}` : ''}</Text>
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
              <View style={styles.footer}>
                <View>
                  <Text style={styles.dataLabel}>Criado em</Text>
                  <Text style={styles.dataText}>{dayjs(o.dataCriacao).format('DD/MM/YYYY')}</Text>
                </View>
                <View>
                  <Text style={[styles.dataLabel, isVencido && { color: '#D32F2F' }]}>
                    {isVencido ? '⚠ Vencido' : 'Validade'}
                  </Text>
                  <Text style={[styles.dataText, isVencido && { color: '#D32F2F' }]}>{dayjs(o.validade).format('DD/MM/YYYY')}</Text>
                </View>
                <Text style={styles.total}>R$ {o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
            </Surface>
            </TouchableOpacity>
          );
        }}
      />
      <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => navigation.navigate('OrcamentoForm')} />
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
          { key: 'pendente', label: 'Pendente' },
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
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  orcNum: { fontSize: 14, fontWeight: '700', color: colors.primary },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  clienteNome: { fontSize: 15, fontWeight: '700', color: colors.onBackground },
  veiculoText: { fontSize: 12, color: '#757575', marginTop: 2, marginBottom: spacing.sm },
  itens: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: spacing.sm, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  itemNome: { fontSize: 12, color: '#757575', flex: 1 },
  itemValor: { fontSize: 12, color: colors.onBackground, fontWeight: '600' },
  maisItens: { fontSize: 11, color: '#9E9E9E', fontStyle: 'italic' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: spacing.sm },
  dataLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600' },
  dataText: { fontSize: 12, color: colors.onBackground },
  total: { fontSize: 18, fontWeight: '800', color: colors.primary },
  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: colors.primary, borderRadius: 16, elevation: 8 },
});
