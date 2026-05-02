import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Surface, FAB, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { mockOrdens, mockClientes, mockVeiculos } from '../../data/mockData';
import { colors, spacing, borderRadius } from '../../theme/theme';
import dayjs from 'dayjs';

type StatusKey = 'todos' | 'em_andamento' | 'aguardando' | 'aguardando_pecas' | 'concluido';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  em_andamento: { label: 'Em Andamento', color: '#1565C0', bg: '#E3F2FD', icon: 'autorenew' },
  aguardando: { label: 'Aguardando', color: '#E65100', bg: '#FFF3E0', icon: 'schedule' },
  aguardando_pecas: { label: 'Aguard. Peças', color: '#6A1B9A', bg: '#F3E5F5', icon: 'inventory' },
  concluido: { label: 'Concluído', color: '#2E7D32', bg: '#E8F5E9', icon: 'check-circle' },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig[status] ?? { label: status, color: '#757575', bg: '#F5F5F5', icon: 'info' };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <MaterialIcons name={s.icon as any} size={11} color={s.color} />
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export default function TarefasScreen() {
  const navigation = useNavigation<any>();
  const [filtroStatus, setFiltroStatus] = useState<StatusKey>('todos');
  const [busca, setBusca] = useState('');

  const filtros: { key: StatusKey; label: string }[] = [
    { key: 'todos', label: 'Todas' },
    { key: 'em_andamento', label: 'Em Andamento' },
    { key: 'aguardando', label: 'Aguardando' },
    { key: 'aguardando_pecas', label: 'Aguard. Peças' },
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
      {/* Busca */}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#9E9E9E" style={{ marginRight: spacing.sm }} />
        <RNTextInput
          placeholder="Buscar OS ou cliente..."
          value={busca}
          onChangeText={setBusca}
          style={styles.searchInput}
          placeholderTextColor="#BDBDBD"
        />
      </View>

      {/* Filtros */}
      <View>
        <FlatList
          horizontal
          data={filtros}
          keyExtractor={f => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, filtroStatus === item.key && styles.chipActive]}
              onPress={() => setFiltroStatus(item.key)}
            >
              <Text style={[styles.chipText, filtroStatus === item.key && styles.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Contagem */}
      <Text style={styles.countText}>{ordens.length} ordem(ns)</Text>

      {/* Lista */}
      <FlatList
        data={ordens}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 80, gap: spacing.sm }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <MaterialIcons name="build-circle" size={48} color="#BDBDBD" />
            <Text style={styles.emptyText}>Nenhuma ordem de serviço</Text>
          </View>
        )}
        renderItem={({ item: os }) => {
          const cliente = mockClientes.find(c => c.id === os.clienteId);
          const veiculo = mockVeiculos.find(v => v.id === os.veiculoId);
          return (
            <TouchableOpacity onPress={() => navigation.navigate('OSDetalhes', { osId: os.id })}>
              <Surface style={styles.card} elevation={1}>
                <View style={styles.cardHeader}>
                  <View style={styles.numBox}>
                    <Text style={styles.numText}>#{String(os.id).padStart(3, '0')}</Text>
                  </View>
                  <StatusBadge status={os.status} />
                </View>
                <Text style={styles.clienteNome}>{cliente?.nome ?? '—'}</Text>
                <Text style={styles.veiculoInfo}>
                  {veiculo ? `${veiculo.marca} ${veiculo.modelo} • ${veiculo.placa}` : '—'}
                </Text>
                <Text style={styles.descricao} numberOfLines={2}>{os.descricao}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.footerItem}>
                    <MaterialIcons name="engineering" size={13} color="#9E9E9E" />
                    <Text style={styles.footerText}>{os.mecanico}</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <MaterialIcons name="event" size={13} color="#9E9E9E" />
                    <Text style={styles.footerText}>{dayjs(os.dataPrevista).format('DD/MM/YYYY')}</Text>
                  </View>
                  <Text style={styles.valor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                </View>
              </Surface>
            </TouchableOpacity>
          );
        }}
      />

      <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: colors.onBackground },
  chipsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: '#757575' },
  chipTextActive: { color: '#FFF' },
  countText: { fontSize: 12, color: '#9E9E9E', marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  numBox: { backgroundColor: '#E3F2FD', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  numText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  clienteNome: { fontSize: 15, fontWeight: '700', color: colors.onBackground },
  veiculoInfo: { fontSize: 12, color: '#757575', marginTop: 2 },
  descricao: { fontSize: 13, color: '#9E9E9E', marginTop: spacing.sm, marginBottom: spacing.sm },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#F5F5F5', flexWrap: 'wrap', gap: 4 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: '#9E9E9E' },
  valor: { fontSize: 15, fontWeight: '800', color: colors.primary },
  empty: { alignItems: 'center', marginTop: 80, gap: spacing.md },
  emptyText: { color: '#9E9E9E', fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
});
