import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, TextInput as RNTextInput, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { useAuth } from '../../context/AuthContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import AdvancedFilterModal from '../../components/AdvancedFilterModal';

type StatusKey = 'todos' | 'em_andamento' | 'aguardando' | 'aguardando_pecas' | 'concluido';
type OSDateFilter = 'todos' | 'mes' | 'semana' | 'hoje' | 'atrasadas' | 'personalizado';


function isWithinCustomRange(value: string, start: string, end: string) {
  const date = dayjs(value);
  const startDate = start ? dayjs(start) : null;
  const endDate = end ? dayjs(end) : null;
  if (startDate?.isValid() && date.isBefore(startDate, 'day')) return false;
  if (endDate?.isValid() && date.isAfter(endDate, 'day')) return false;
  return true;
}

const osFields: CrudField[] = [
  { key: 'cliente_id', label: 'Cliente', keyboardType: 'number-pad' },
  { key: 'veiculo_id', label: 'Veículo', keyboardType: 'number-pad' },
  { key: 'funcionario_id', label: 'Funcionário', keyboardType: 'number-pad' },
  { key: 'observacoes', label: 'Descricao', multiline: true },
  { key: 'valor_total', label: 'Valor total', keyboardType: 'decimal-pad' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: keyof typeof MaterialIcons.glyphMap; barColor: string }> = {
  em_andamento:    { label: 'Em Andamento',  color: palette.navy700,    bg: palette.navy50,      icon: 'autorenew',    barColor: palette.navy700 },
  aguardando:      { label: 'Aguardando',    color: '#C2410C',          bg: '#FFF7ED',           icon: 'schedule',     barColor: '#F97316' },
  aguardando_pecas:{ label: 'Aguard. Peças', color: palette.violet600,  bg: '#F5F3FF',           icon: 'inventory',    barColor: palette.violet600 },
  concluido:       { label: 'Concluído',     color: palette.emerald600, bg: palette.emerald100,  icon: 'check-circle', barColor: palette.emerald600 },
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

export default function TarefasScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { ordens: ordensData, clientes, veiculos, refresh, isLoading } = useDriveOnData();
  const { can } = useAuth();
  const [filtroStatus, setFiltroStatus] = useState<StatusKey>('todos');
  const [filtroData, setFiltroData] = useState<OSDateFilter>('mes');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [busca, setBusca] = useState('');
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
      atrasadas: 'Atrasadas',
      personalizado: 'Personalizado',
    };
    const statusLabels: Record<string, string> = {
      todos: 'Todas',
      em_andamento: 'Andamento',
      aguardando: 'Aguardando',
      aguardando_pecas: 'Aguard. Peças',
      concluido: 'Concluído',
    };

    let label = `Período: ${periodLabels[filtroData] ?? filtroData}`;
    if (filtroData === 'personalizado') {
      if (customStart || customEnd) {
        const startStr = customStart ? dayjs(customStart).format('DD/MM/YY') : '...';
        const endStr = customEnd ? dayjs(customEnd).format('DD/MM/YY') : '...';
        label = `Período: ${startStr} - ${endStr}`;
      }
    }
    return `${label} · Status: ${statusLabels[filtroStatus] ?? filtroStatus}`;
  };

  const filtros: { key: StatusKey; label: string }[] = [
    { key: 'todos', label: 'Todas' },
    { key: 'em_andamento', label: 'Andamento' },
    { key: 'aguardando', label: 'Aguardando' },
    { key: 'aguardando_pecas', label: 'Peças' },
    { key: 'concluido', label: 'Concluído' },
  ];

  const ordens = ordensData.filter(os => {
    const cliente = clientes.find(c => c.id === os.clienteId);
    const matchBusca = busca === '' || cliente?.nome.toLowerCase().includes(busca.toLowerCase()) || String(os.id).includes(busca);
    const matchStatus = filtroStatus === 'todos' || os.status === filtroStatus;
    const entrada = dayjs(os.dataEntrada);
    const prevista = dayjs(os.dataPrevista);
    const matchData =
      filtroData === 'todos' ||
      (filtroData === 'hoje' && entrada.isSame(dayjs(), 'day')) ||
      (filtroData === 'semana' && entrada.isSame(dayjs(), 'week')) ||
      (filtroData === 'mes' && entrada.isSame(dayjs(), 'month')) ||
      (filtroData === 'atrasadas' && os.status !== 'concluido' && prevista.isBefore(dayjs(), 'day')) ||
      (filtroData === 'personalizado' && isWithinCustomRange(os.dataEntrada, customStart, customEnd));
    return matchBusca && matchStatus && matchData;
  });

  useEffect(() => {
    if (route.params?.openForm) {
      navigation.navigate('OSForm');
      navigation.setParams({ openForm: undefined });
    }
  }, [route.params?.openForm]);

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Ordens de Serviço" 
        subtitle={isLoading ? 'Carregando...' : `${ordens.length} resultado${ordens.length !== 1 ? 's' : ''}`}
        showBack={false} 
      />

      {/* ── Search ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={palette.slate400} />
          <RNTextInput
            placeholder="Buscar OS, cliente..."
            value={busca}
            onChangeText={setBusca}
            style={styles.searchInput}
            placeholderTextColor={palette.slate400}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <MaterialIcons name="close" size={18} color={palette.slate400} />
            </TouchableOpacity>
          )}
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

      <FlatList
        data={ordens}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        style={styles.mainList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[palette.navy800]} />
        }
        ListEmptyComponent={() => (
          isLoading ? (
            <LoadingState message="Carregando ordens de servico..." isFullPage />
          ) : (
            <EmptyState
              icon="build"
              message={busca.length > 0 ? 'Nenhuma OS encontrada para esta busca' : 'Nenhuma ordem de serviço'}
              helper={busca.length > 0 ? 'Tente buscar pelo número da OS ou pelo nome do cliente.' : 'Abra uma ordem de serviço para registrar o trabalho da oficina.'}
              actionLabel={busca.length > 0 || !can('ordens', 'create') ? undefined : 'Nova Ordem'}
              onAction={busca.length > 0 || !can('ordens', 'create') ? undefined : () => navigation.navigate('OSForm')}
              isFullPage
            />
          )
        )}
        renderItem={({ item: os }) => {
          const cliente = clientes.find(c => c.id === os.clienteId);
          const veiculo = veiculos.find(v => v.id === os.veiculoId);
          const barColor = statusConfig[os.status]?.barColor ?? palette.slate400;
          return (
            <TouchableOpacity onPress={() => navigation.navigate('OSDetalhes', { osId: os.id })} activeOpacity={0.7}>
              <View style={styles.card}>
                {/* Barra lateral por status */}
                <View style={[styles.cardBar, { backgroundColor: barColor }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.numBox}>
                      <Text style={styles.numText}>#{String(os.id).padStart(3, '0')}</Text>
                    </View>
                    <StatusBadge status={os.status} />
                  </View>
                  <Text style={styles.clienteNome}>{cliente?.nome ?? '—'}</Text>
                  <Text style={styles.veiculoInfo}>
                    {veiculo ? `${veiculo.marca} ${veiculo.modelo} · ${veiculo.placa}` : '—'}
                  </Text>
                  <Text style={styles.descricao} numberOfLines={1}>{os.descricao}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <MaterialIcons name="engineering" size={13} color={palette.slate400} />
                      <Text style={styles.footerText}>{os.mecanico}</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <MaterialIcons name="event" size={13} color={palette.slate400} />
                      <Text style={styles.footerText}>{dayjs(os.dataPrevista).format('DD/MM/YY')}</Text>
                    </View>
                    <Text style={styles.valor}>
                      R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {can('ordens', 'create') && (
        <FAB icon="plus" style={styles.fab} color={palette.white} onPress={() => navigation.navigate('OSForm')} />
      )}
      <AdvancedFilterModal
        visible={filterModalVisible}
        periodValue={filtroData}
        periodOptions={[
          { key: 'mes', label: 'Este mês' },
          { key: 'semana', label: 'Esta semana' },
          { key: 'hoje', label: 'Hoje' },
          { key: 'atrasadas', label: 'Atrasadas' },
          { key: 'todos', label: 'Todos os períodos' },
          { key: 'personalizado', label: 'Personalizado' },
        ]}
        statusValue={filtroStatus}
        statusOptions={[
          { key: 'todos', label: 'Todas' },
          { key: 'em_andamento', label: 'Em Andamento' },
          { key: 'aguardando', label: 'Aguardando' },
          { key: 'aguardando_pecas', label: 'Aguard. Peças' },
          { key: 'concluido', label: 'Concluído' },
        ]}
        customStart={customStart}
        customEnd={customEnd}
        onApply={(period, status, start, end) => {
          setFiltroData(period as OSDateFilter);
          setFiltroStatus(status as StatusKey);
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

  topHeader: { paddingBottom: 20, paddingHorizontal: spacing.lg },
  headerTitle: { fontSize: 24, fontWeight: '800', color: palette.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  searchContainer: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.lg, 
    paddingHorizontal: spacing.md, 
    height: 52, 
    gap: spacing.sm, 
    borderWidth: 1, 
    borderColor: 'rgba(15, 23, 42, 0.05)', 
    ...shadows.md 
  },
  searchInput: { flex: 1, fontSize: 14, color: palette.slate900, fontWeight: '500' },

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

  mainList: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 160, gap: spacing.sm },

  // Card
  card: { backgroundColor: palette.white, borderRadius: borderRadius.lg, flexDirection: 'row', overflow: 'hidden', ...shadows.sm },
  cardBar: { width: 5 },
  cardContent: { flex: 1, padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  numBox: { backgroundColor: palette.navy50, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  numText: { fontSize: 12, fontWeight: '700', color: palette.navy800 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  clienteNome: { fontSize: 15, fontWeight: '700', color: palette.slate900 },
  veiculoInfo: { fontSize: 12, color: palette.slate500, marginTop: 2 },
  descricao: { fontSize: 12, color: palette.slate400, marginTop: 4, marginBottom: spacing.sm },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: palette.slate100, gap: 4 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: palette.slate400 },
  valor: { fontSize: 15, fontWeight: '800', color: palette.navy800 },

  // Empty
  empty: { alignItems: 'center', marginTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: palette.slate700 },
  emptyText: { fontSize: 14, color: palette.slate400 },

  // FAB
  fab: { 
    position: 'absolute', 
    bottom: 96, 
    right: 20, 
    backgroundColor: palette.navy800,
    borderRadius: borderRadius.lg,
    ...shadows.lg
  },
});
