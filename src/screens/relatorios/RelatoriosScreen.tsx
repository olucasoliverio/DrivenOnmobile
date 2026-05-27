import React from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Surface } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const relatorios = [
  { id: 'geral', icon: 'assessment', label: 'Relatório Geral', desc: 'Visão completa da oficina', color: '#1B5E20' },
  { id: 'financeiro', icon: 'account-balance', label: 'Financeiro', desc: 'Receitas, despesas e saldo', color: '#1565C0' },
  { id: 'clientes', icon: 'people', label: 'Clientes', desc: 'Análise da carteira', color: '#6A1B9A' },
  { id: 'agenda', icon: 'event-note', label: 'Agenda', desc: 'Taxa de ocupação e confirmações', color: '#E65100' },
];

export default function RelatoriosScreen() {
  const insets = useSafeAreaInsets();
  const { dashboard, ordens, pagamentos } = useDriveOnData();
  const receitaTotal = pagamentos.filter(p => p.tipo === 'receber' && p.status === 'pago').reduce((a, p) => a + p.valor, 0);
  const despesaTotal = pagamentos.filter(p => p.tipo === 'pagar' && p.status === 'pago').reduce((a, p) => a + p.valor, 0);
  const osConcluidas = ordens.filter(o => o.status === 'concluido').length;
  const ticketMedio = osConcluidas > 0 ? ordens.filter(o => o.status === 'concluido').reduce((a, o) => a + o.valor, 0) / osConcluidas : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}>
      {/* KPIs rápidos */}
      <View style={styles.kpiContainer}>
        <Surface style={styles.kpiCard} elevation={1}>
          <Text style={styles.kpiValue}>R$ {receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.kpiLabel}>Receita Confirmada</Text>
        </Surface>
        <Surface style={styles.kpiCard} elevation={1}>
          <Text style={[styles.kpiValue, { color: '#D32F2F' }]}>R$ {despesaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.kpiLabel}>Despesas Pagas</Text>
        </Surface>
        <Surface style={styles.kpiCard} elevation={1}>
          <Text style={[styles.kpiValue, { color: '#2E7D32' }]}>R$ {(receitaTotal - despesaTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.kpiLabel}>Lucro Líquido</Text>
        </Surface>
        <Surface style={styles.kpiCard} elevation={1}>
          <Text style={styles.kpiValue}>R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          <Text style={styles.kpiLabel}>Ticket Médio</Text>
        </Surface>
      </View>

      <Text style={styles.sectionTitle}>Relatórios Disponíveis</Text>
      {relatorios.map(r => (
        <TouchableOpacity key={r.id} onPress={() => Alert.alert(r.label, 'Relatorio detalhado ainda precisa de endpoint/exportacao no backend. Os indicadores resumidos ja usam dados reais.')}>
          <Surface style={styles.relCard} elevation={1}>
            <View style={[styles.iconCircle, { backgroundColor: r.color + '15' }]}>
              <MaterialIcons name={r.icon as any} size={28} color={r.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.relLabel}>{r.label}</Text>
              <Text style={styles.relDesc}>{r.desc}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#BDBDBD" />
          </Surface>
        </TouchableOpacity>
      ))}

      {/* Distribuição status OS */}
      <Surface style={styles.chartSection} elevation={1}>
        <Text style={styles.chartTitle}>Distribuição de OS</Text>
        {dashboard.statusOS.map(s => (
          <View key={s.status} style={styles.barRow}>
            <Text style={styles.barLabel}>{s.status}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { flex: s.count, backgroundColor: s.color }]} />
              <View style={{ flex: Math.max(ordens.length - s.count, 0) }} />
            </View>
            <Text style={[styles.barCount, { color: s.color }]}>{s.count}</Text>
          </View>
        ))}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  kpiContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm },
  kpiCard: { width: '47%', borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  kpiValue: { fontSize: 16, fontWeight: '800', color: colors.primary },
  kpiLabel: { fontSize: 11, color: '#757575', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.onBackground, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  relCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  iconCircle: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  relLabel: { fontSize: 15, fontWeight: '700', color: colors.onBackground },
  relDesc: { fontSize: 12, color: '#757575', marginTop: 2 },
  chartSection: { margin: spacing.lg, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  chartTitle: { fontSize: 15, fontWeight: '700', color: colors.onBackground, marginBottom: spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  barLabel: { fontSize: 12, color: '#757575', width: 100 },
  barTrack: { flex: 1, flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#F0F0F0' },
  barFill: { borderRadius: 5 },
  barCount: { fontSize: 13, fontWeight: '700', width: 20, textAlign: 'right' },
});
