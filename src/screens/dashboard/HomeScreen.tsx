import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Surface, ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { mockDashboard, mockOrdens, mockAgendamentos, mockClientes, mockVeiculos } from '../../data/mockData';
import { colors, spacing, borderRadius } from '../../theme/theme';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

const { width } = Dimensions.get('window');

function KpiCard({ icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <Surface style={[styles.kpiCard, { borderLeftColor: color }]} elevation={1}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </Surface>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    em_andamento: { label: 'Em Andamento', color: '#1565C0', bg: '#E3F2FD' },
    aguardando: { label: 'Aguardando', color: '#E65100', bg: '#FFF3E0' },
    aguardando_pecas: { label: 'Aguard. Peças', color: '#6A1B9A', bg: '#F3E5F5' },
    concluido: { label: 'Concluído', color: '#2E7D32', bg: '#E8F5E9' },
  };
  const s = map[status] ?? { label: status, color: '#757575', bg: '#F5F5F5' };
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
      <Text style={{ color: s.color, fontSize: 11, fontWeight: '700' }}>{s.label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const d = mockDashboard;
  const variacao = ((d.receitaMes - d.receitaAnterior) / d.receitaAnterior * 100).toFixed(1);
  const ordensAbertas = mockOrdens.filter(o => o.status !== 'concluido');
  const agendamentosHoje = mockAgendamentos.filter(a => dayjs(a.data).isSame(dayjs(), 'day'));

  const maxReceita = Math.max(...d.receitaMensal.map(r => r.valor));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cabeçalho */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.greeting}>Bom dia! 👋</Text>
          <Text style={styles.dateText}>{dayjs().format('dddd, D [de] MMMM')}</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>AD</Text>
        </View>
      </View>

      {/* KPIs */}
      <Text style={styles.sectionTitle}>Resumo do Mês</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
        <KpiCard icon="attach-money" label="Receita" value={`R$ ${d.receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} sub={`+${variacao}% vs mês ant.`} color="#1565C0" />
        <KpiCard icon="build" label="OS em Aberto" value={String(d.osAbertas)} sub={`${d.osConcluidas} concluídas`} color="#FF6F00" />
        <KpiCard icon="event" label="Agenda Hoje" value={String(agendamentosHoje.length)} color="#2E7D32" />
        <KpiCard icon="people" label="Clientes" value={String(d.clientesAtivos)} color="#6A1B9A" />
      </ScrollView>

      {/* Gráfico de barras simples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receita Mensal</Text>
        <Surface style={styles.chartCard} elevation={1}>
          <View style={styles.bars}>
            {d.receitaMensal.map((item) => (
              <View key={item.mes} style={styles.barWrapper}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${(item.valor / maxReceita) * 100}%`, backgroundColor: item.mes === 'Abr' ? colors.primary : '#BBDEFB' },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.mes}</Text>
                <Text style={[styles.barValue, item.mes === 'Abr' && { color: colors.primary, fontWeight: '700' }]}>
                  {(item.valor / 1000).toFixed(1)}k
                </Text>
              </View>
            ))}
          </View>
        </Surface>
      </View>

      {/* OS Abertas */}
      <View style={styles.section}>
        <View style={styles.rowHeader}>
          <Text style={styles.sectionTitle}>OS em Andamento</Text>
          <Text style={styles.viewAll}>{ordensAbertas.length} abertas</Text>
        </View>
        {ordensAbertas.map((os) => {
          const cliente = mockClientes.find(c => c.id === os.clienteId);
          const veiculo = mockVeiculos.find(v => v.id === os.veiculoId);
          return (
            <Surface key={os.id} style={styles.osCard} elevation={1}>
              <View style={styles.osRow}>
                <View style={styles.osNumber}>
                  <Text style={styles.osNumberText}>#{String(os.id).padStart(3, '0')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.osCliente}>{cliente?.nome ?? '—'}</Text>
                  <Text style={styles.osVeiculo}>{veiculo ? `${veiculo.marca} ${veiculo.modelo} • ${veiculo.placa}` : '—'}</Text>
                  <Text style={styles.osDesc} numberOfLines={1}>{os.descricao}</Text>
                </View>
                <StatusBadge status={os.status} />
              </View>
              <View style={styles.osDivider} />
              <View style={styles.osFooter}>
                <Text style={styles.osData}>📅 {dayjs(os.dataPrevista).format('DD/MM')}</Text>
                <Text style={styles.osValor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
            </Surface>
          );
        })}
      </View>

      {/* Agendamentos de hoje */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agenda de Hoje</Text>
        {agendamentosHoje.length === 0 ? (
          <Surface style={styles.emptyCard} elevation={0}>
            <Text style={styles.emptyText}>Nenhum agendamento para hoje.</Text>
          </Surface>
        ) : agendamentosHoje.map((ag) => {
          const cliente = mockClientes.find(c => c.id === ag.clienteId);
          const veiculo = mockVeiculos.find(v => v.id === ag.veiculoId);
          return (
            <Surface key={ag.id} style={styles.agCard} elevation={1}>
              <Text style={styles.agHora}>{ag.hora}</Text>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.agCliente}>{cliente?.nome}</Text>
                <Text style={styles.agVeiculo}>{veiculo ? `${veiculo.marca} ${veiculo.modelo}` : ''} • {ag.servico}</Text>
              </View>
              <View style={[styles.agStatus, ag.status === 'confirmado' ? { backgroundColor: '#E8F5E9' } : { backgroundColor: '#FFF3E0' }]}>
                <Text style={{ fontSize: 10, color: ag.status === 'confirmado' ? '#2E7D32' : '#E65100', fontWeight: '700' }}>
                  {ag.status === 'confirmado' ? 'CONFIRMADO' : 'PENDENTE'}
                </Text>
              </View>
            </Surface>
          );
        })}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: spacing.md, backgroundColor: '#FFF' },
  greeting: { fontSize: 20, fontWeight: '700', color: colors.onBackground },
  dateText: { fontSize: 13, color: '#757575', marginTop: 2, textTransform: 'capitalize' },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.onBackground, marginBottom: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  kpiRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm, flexDirection: 'row' },
  kpiCard: { width: 140, borderRadius: borderRadius.md, padding: spacing.md, borderLeftWidth: 4, backgroundColor: '#FFF' },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  kpiValue: { fontSize: 18, fontWeight: '800', color: colors.onBackground },
  kpiLabel: { fontSize: 12, color: '#757575', marginTop: 2 },
  kpiSub: { fontSize: 11, color: '#2E7D32', marginTop: 2 },
  section: { marginTop: spacing.sm },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg },
  viewAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  chartCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  barWrapper: { flex: 1, alignItems: 'center' },
  barTrack: { width: 24, height: 80, borderRadius: 6, backgroundColor: '#F0F0F0', justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, color: '#757575', marginTop: 4 },
  barValue: { fontSize: 10, color: '#9E9E9E', marginTop: 1 },
  osCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  osRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  osNumber: { backgroundColor: '#E3F2FD', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  osNumberText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  osCliente: { fontSize: 14, fontWeight: '700', color: colors.onBackground },
  osVeiculo: { fontSize: 12, color: '#757575', marginTop: 2 },
  osDesc: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  osDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: spacing.sm },
  osFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  osData: { fontSize: 12, color: '#757575' },
  osValor: { fontSize: 14, fontWeight: '700', color: colors.primary },
  emptyCard: { marginHorizontal: spacing.lg, borderRadius: borderRadius.md, padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: '#9E9E9E', fontSize: 14 },
  agCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  agHora: { fontSize: 16, fontWeight: '800', color: colors.primary, width: 46 },
  agCliente: { fontSize: 14, fontWeight: '600', color: colors.onBackground },
  agVeiculo: { fontSize: 12, color: '#757575', marginTop: 1 },
  agStatus: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
});
