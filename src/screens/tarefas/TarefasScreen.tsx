import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { mockOrdens, mockClientes, mockVeiculos } from '../../data/mockData';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';

type StatusKey = 'todos' | 'em_andamento' | 'aguardando' | 'aguardando_pecas' | 'concluido';

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
  const [filtroStatus, setFiltroStatus] = useState<StatusKey>('todos');
  const [busca, setBusca] = useState('');

  const filtros: { key: StatusKey; label: string }[] = [
    { key: 'todos', label: 'Todas' },
    { key: 'em_andamento', label: 'Andamento' },
    { key: 'aguardando', label: 'Aguardando' },
    { key: 'aguardando_pecas', label: 'Peças' },
    { key: 'concluido', label: 'Concluído' },
  ];

  const ordens = mockOrdens.filter(os => {
    const cliente = mockClientes.find(c => c.id === os.clienteId);
    const matchBusca = busca === '' || cliente?.nome.toLowerCase().includes(busca.toLowerCase()) || String(os.id).includes(busca);
    const matchStatus = filtroStatus === 'todos' || os.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  return (
    <View style={styles.container}>

      {/* ── Mini Header ── */}
      <LinearGradient colors={gradients.navyDark} style={[styles.topHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Ordens de Serviço</Text>
        <Text style={styles.headerSub}>{ordens.length} resultado{ordens.length !== 1 ? 's' : ''}</Text>
      </LinearGradient>

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

      {/* ── Filtros ── */}
      <FlatList
        horizontal
        data={filtros}
        keyExtractor={f => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsContainer}
        renderItem={({ item }) => {
          const isActive = filtroStatus === item.key;
          return (
            <TouchableOpacity
              onPress={() => setFiltroStatus(item.key)}
              activeOpacity={0.7}
            >
              {isActive ? (
                <LinearGradient colors={gradients.navyPrimary} style={styles.chipActive}>
                  <Text style={styles.chipTextActive}>{item.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{item.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Lista de OS ── */}
      <FlatList
        data={ordens}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <MaterialIcons name="build-circle" size={56} color={palette.slate200} />
            <Text style={styles.emptyTitle}>Nenhuma OS</Text>
            <Text style={styles.emptyText}>Tente ajustar os filtros</Text>
          </View>
        )}
        renderItem={({ item: os }) => {
          const cliente = mockClientes.find(c => c.id === os.clienteId);
          const veiculo = mockVeiculos.find(v => v.id === os.veiculoId);
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

      <FAB icon="plus" style={styles.fab} color={palette.white} onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  // Top header
  topHeader: { paddingBottom: 20, paddingHorizontal: spacing.lg },
  headerTitle: { fontSize: 22, fontWeight: '800', color: palette.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Search
  searchContainer: { marginHorizontal: spacing.lg, marginTop: -16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: 12, gap: spacing.sm, ...shadows.md },
  searchInput: { flex: 1, fontSize: 14, color: palette.slate900 },

  // Chips
  chipsContainer: { marginTop: spacing.sm },
  chipsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.slate200 },
  chipActive: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full },
  chipText: { fontSize: 12, fontWeight: '600', color: palette.slate500 },
  chipTextActive: { fontSize: 12, fontWeight: '700', color: palette.white },

  // List
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 90, gap: spacing.sm },

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
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: palette.navy800 },
});
