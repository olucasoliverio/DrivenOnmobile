import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, FAB, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius, palette } from '../../theme/theme';
import dayjs from 'dayjs';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import { sendEstimateMessage } from '../../services/whatsappService';
import CalendarDatePicker from '../../components/CalendarDatePicker';

type OrcamentoDateFilter = 'todos' | 'criados_mes' | 'vencidos' | 'vencem7' | 'personalizado';

const orcamentoDateFilters: { key: OrcamentoDateFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'criados_mes', label: 'Criados este mês' },
  { key: 'vencidos', label: 'Vencidos' },
  { key: 'vencem7', label: 'Vencem 7 dias' },
  { key: 'personalizado', label: 'Personalizado' },
];

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
  const { orcamentos: orcamentosData, clientes, veiculos, deleteRecord } = useDriveOnData();
  const [filtro, setFiltro] = useState<'todos' | 'aprovado' | 'pendente' | 'recusado'>('todos');
  const [filtroData, setFiltroData] = useState<OrcamentoDateFilter>('todos');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customDatePicker, setCustomDatePicker] = useState<null | 'start' | 'end'>(null);

  const orcamentos = orcamentosData.filter(o => {
    const matchStatus = filtro === 'todos' || o.status === filtro;
    const criacao = dayjs(o.dataCriacao);
    const validade = dayjs(o.validade);
    const matchData =
      filtroData === 'todos' ||
      (filtroData === 'criados_mes' && criacao.isSame(dayjs(), 'month')) ||
      (filtroData === 'vencidos' && o.status === 'pendente' && validade.isBefore(dayjs(), 'day')) ||
      (filtroData === 'vencem7' && validade.isAfter(dayjs().subtract(1, 'day'), 'day') && validade.isBefore(dayjs().add(8, 'day'), 'day')) ||
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
      <View style={styles.chips}>
        {(['todos', 'aprovado', 'pendente', 'recusado'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filtro === f && styles.chipActive]} onPress={() => setFiltro(f)}>
            <Text style={[styles.chipText, filtro === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dateFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateFilterRow}>
          {orcamentoDateFilters.map(item => {
            const isActive = filtroData === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.dateChip, isActive && styles.dateChipActive]}
                onPress={() => setFiltroData(item.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dateChipText, isActive && styles.dateChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {filtroData === 'personalizado' ? (
          <View style={styles.customRangeRow}>
            <TouchableOpacity
              style={styles.customDateButton}
              activeOpacity={0.75}
              onPress={() => setCustomDatePicker('start')}
            >
              <MaterialIcons name="calendar-today" size={16} color={palette.slate400} />
              <Text style={[styles.customDateText, !customStart && styles.customDatePlaceholder]}>
                {customStart ? dayjs(customStart).format('DD/MM/YYYY') : 'Início'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.customDateButton}
              activeOpacity={0.75}
              onPress={() => setCustomDatePicker('end')}
            >
              <MaterialIcons name="event-available" size={16} color={palette.slate400} />
              <Text style={[styles.customDateText, !customEnd && styles.customDatePlaceholder]}>
                {customEnd ? dayjs(customEnd).format('DD/MM/YYYY') : 'Fim'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <FlatList
        data={orcamentos}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 100, flexGrow: 1 }}
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
      <CalendarDatePicker
        visible={customDatePicker != null}
        value={customDatePicker === 'end' ? customEnd : customStart}
        title={customDatePicker === 'end' ? 'Fim' : 'Início'}
        onSelect={date => {
          if (customDatePicker === 'end') setCustomEnd(date);
          else setCustomStart(date);
        }}
        onClose={() => setCustomDatePicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },
  chips: { flexDirection: 'row', padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: '#757575' },
  chipTextActive: { color: '#FFF' },
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
