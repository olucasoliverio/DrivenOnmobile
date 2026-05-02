import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Surface, FAB } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { mockOrcamentos, mockClientes, mockVeiculos } from '../../data/mockData';
import { colors, spacing, borderRadius } from '../../theme/theme';
import dayjs from 'dayjs';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  aprovado: { label: 'Aprovado', color: '#2E7D32', bg: '#E8F5E9' },
  pendente: { label: 'Pendente', color: '#E65100', bg: '#FFF3E0' },
  recusado: { label: 'Recusado', color: '#D32F2F', bg: '#FFEBEE' },
};

export default function OrcamentosScreen() {
  const [filtro, setFiltro] = useState<'todos' | 'aprovado' | 'pendente' | 'recusado'>('todos');

  const orcamentos = mockOrcamentos.filter(o => filtro === 'todos' || o.status === filtro);

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {(['todos', 'aprovado', 'pendente', 'recusado'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filtro === f && styles.chipActive]} onPress={() => setFiltro(f)}>
            <Text style={[styles.chipText, filtro === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orcamentos}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 }}
        renderItem={({ item: o }) => {
          const cliente = mockClientes.find(c => c.id === o.clienteId);
          const veiculo = mockVeiculos.find(v => v.id === o.veiculoId);
          const st = statusConfig[o.status] ?? { label: o.status, color: '#757575', bg: '#F5F5F5' };
          const isVencido = dayjs(o.validade).isBefore(dayjs()) && o.status === 'pendente';
          return (
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardHeader}>
                <Text style={styles.orcNum}>ORC #{String(o.id).padStart(3, '0')}</Text>
                <View style={[styles.badge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              <Text style={styles.clienteNome}>{cliente?.nome}</Text>
              <Text style={styles.veiculoText}>{veiculo ? `${veiculo.marca} ${veiculo.modelo} • ${veiculo.placa}` : ''}</Text>
              <View style={styles.itens}>
                {o.itens.slice(0, 2).map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemNome} numberOfLines={1}>{item.descricao}</Text>
                    <Text style={styles.itemValor}>R$ {(item.qtd * item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                  </View>
                ))}
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
          );
        }}
      />
      <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  chips: { flexDirection: 'row', padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: '#757575' },
  chipTextActive: { color: '#FFF' },
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
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
});
