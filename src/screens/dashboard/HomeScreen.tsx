import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.sm * 3) / 2;

// ─── Status Badge ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  em_andamento:    { label: 'Em Andamento',   color: palette.navy700,    bg: palette.navy50 },
  aguardando:      { label: 'Aguardando',     color: '#C2410C',          bg: '#FFF7ED' },
  aguardando_pecas:{ label: 'Aguard. Peças',  color: palette.violet600,  bg: '#F5F3FF' },
  concluido:       { label: 'Concluído',      color: palette.emerald600, bg: palette.emerald100 },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: palette.slate500, bg: palette.slate100 };
  return (
    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusBadgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
type IconName = keyof typeof MaterialIcons.glyphMap;
function KpiCard({ icon, label, value, sub, iconBg, iconColor }: {
  icon: IconName; label: string; value: string; sub?: string; iconBg: string; iconColor: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIconBox, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    dashboard: d,
    ordens,
    agendamentos,
    clientes,
    veiculos,
  } = useDriveOnData();
  console.log('[HomeScreen] Rendering with dashboard data:', {
    receitaMes: d?.receitaMes,
    osAbertas: d?.osAbertas,
    clientesCount: clientes?.length,
    veiculosCount: veiculos?.length,
    ordensCount: ordens?.length
  });
  const variacao = ((d.receitaMes - d.receitaAnterior) / d.receitaAnterior * 100).toFixed(1);
  const ordensAbertas = ordens.filter(o => o.status !== 'concluido');
  const agendamentosHoje = agendamentos.filter(a => dayjs(a.data).isSame(dayjs(), 'day'));
  const maxReceita = Math.max(...d.receitaMensal.map(r => r.valor));
  const hora = dayjs().hour();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Header Gradiente ── */}
      <LinearGradient colors={gradients.navyDark} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{saudacao}! 👋</Text>
            <Text style={styles.dateText}>{dayjs().format('dddd, D [de] MMMM')}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>AD</Text>
          </View>
        </View>

        {/* KPIs 2×2 dentro do header */}
        <View style={styles.kpiGrid}>
          <KpiCard
            icon="attach-money"
            label="Receita"
            value={`R$ ${(d.receitaMes / 1000).toFixed(1)}k`}
            sub={`+${variacao}%`}
            iconBg="rgba(245,158,11,0.2)"
            iconColor={palette.amber400}
          />
          <KpiCard
            icon="build"
            label="OS Abertas"
            value={String(d.osAbertas)}
            sub={`${d.osConcluidas} concluídas`}
            iconBg="rgba(255,255,255,0.15)"
            iconColor={palette.white}
          />
          <KpiCard
            icon="event"
            label="Agenda Hoje"
            value={String(agendamentosHoje.length)}
            iconBg="rgba(16,185,129,0.2)"
            iconColor="#34D399"
          />
          <KpiCard
            icon="people"
            label="Clientes"
            value={String(d.clientesAtivos)}
            iconBg="rgba(167,139,250,0.2)"
            iconColor="#A78BFA"
          />
        </View>
      </LinearGradient>

      {/* ── Gráfico de Receita ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Receita Mensal</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>2025</Text>
          </View>
        </View>
        <View style={styles.chartCard}>
          <View style={styles.bars}>
            {d.receitaMensal.map((item) => {
              const isActive = item.mes === 'Abr';
              const pct = (item.valor / maxReceita) * 100;
              return (
                <View key={item.mes} style={styles.barWrapper}>
                  <Text style={[styles.barValue, isActive && { color: palette.navy800, fontWeight: '700' }]}>
                    {(item.valor / 1000).toFixed(0)}k
                  </Text>
                  <View style={styles.barTrack}>
                    {isActive ? (
                      <LinearGradient
                        colors={gradients.navyPrimary}
                        style={[styles.barFill, { height: `${pct}%` }]}
                      />
                    ) : (
                      <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: palette.slate200 }]} />
                    )}
                  </View>
                  <Text style={[styles.barLabel, isActive && { color: palette.navy800, fontWeight: '700' }]}>
                    {item.mes}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── OS em Andamento ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OS em Andamento</Text>
          <View style={[styles.sectionBadge, { backgroundColor: palette.amber100 }]}>
            <Text style={[styles.sectionBadgeText, { color: '#92400E' }]}>{ordensAbertas.length} abertas</Text>
          </View>
        </View>
        {ordensAbertas.map((os) => {
          const cliente = clientes.find(c => c.id === os.clienteId);
          const veiculo = veiculos.find(v => v.id === os.veiculoId);
          const statusColor = STATUS_MAP[os.status]?.color ?? palette.slate500;
          return (
            <View key={os.id} style={styles.osCard}>
              {/* Faixa lateral colorida */}
              <View style={[styles.osColorBar, { backgroundColor: statusColor }]} />
              <View style={styles.osContent}>
                <View style={styles.osHeader}>
                  <View style={styles.osNumBox}>
                    <Text style={styles.osNumText}>#{String(os.id).padStart(3, '0')}</Text>
                  </View>
                  <StatusBadge status={os.status} />
                </View>
                <Text style={styles.osCliente}>{cliente?.nome ?? '—'}</Text>
                <Text style={styles.osVeiculo}>
                  {veiculo ? `${veiculo.marca} ${veiculo.modelo} · ${veiculo.placa}` : '—'}
                </Text>
                <Text style={styles.osDesc} numberOfLines={1}>{os.descricao}</Text>
                <View style={styles.osDivider} />
                <View style={styles.osFooter}>
                  <View style={styles.osFooterItem}>
                    <MaterialIcons name="event" size={12} color={palette.slate400} />
                    <Text style={styles.osFooterText}>{dayjs(os.dataPrevista).format('DD/MM')}</Text>
                  </View>
                  <Text style={styles.osValor}>
                    R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Agenda de Hoje ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agenda de Hoje</Text>
        {agendamentosHoje.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="event-available" size={32} color={palette.slate300} />
            <Text style={styles.emptyText}>Nenhum agendamento para hoje</Text>
          </View>
        ) : (
          agendamentosHoje.map((ag) => {
            const cliente = clientes.find(c => c.id === ag.clienteId);
            const veiculo = veiculos.find(v => v.id === ag.veiculoId);
            const isConfirmado = ag.status === 'confirmado';
            return (
              <View key={ag.id} style={styles.agCard}>
                <LinearGradient
                  colors={isConfirmado ? gradients.navyPrimary : ['#F59E0B', '#FBBF24']}
                  style={styles.agTimeBox}
                >
                  <Text style={styles.agHora}>{ag.hora}</Text>
                </LinearGradient>
                <View style={styles.agInfo}>
                  <Text style={styles.agCliente}>{cliente?.nome}</Text>
                  <Text style={styles.agVeiculo}>
                    {veiculo ? `${veiculo.marca} ${veiculo.modelo}` : ''} · {ag.servico}
                  </Text>
                </View>
                <View style={[styles.agBadge, { backgroundColor: isConfirmado ? palette.emerald100 : palette.amber100 }]}>
                  <Text style={[styles.agBadgeText, { color: isConfirmado ? palette.emerald600 : '#92400E' }]}>
                    {isConfirmado ? '✓' : '⏳'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  // Header
  header: { paddingBottom: 24, overflow: 'hidden' },
  headerCircle1: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.04)', top: -80, right: -60 },
  headerCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, left: -40 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  greeting: { fontSize: 22, fontWeight: '800', color: palette.white },
  dateText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2, textTransform: 'capitalize' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: palette.white, fontWeight: '700', fontSize: 14 },

  // KPI grid (2×2 no header)
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm },
  kpiCard: { width: CARD_WIDTH, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  kpiIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  kpiValue: { fontSize: 20, fontWeight: '800', color: palette.white },
  kpiLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  kpiSub: { fontSize: 10, color: '#34D399', marginTop: 2 },

  // Sections
  section: { marginTop: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: palette.slate900, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  sectionBadge: { backgroundColor: palette.slate200, borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 3 },
  sectionBadgeText: { fontSize: 11, fontWeight: '600', color: palette.slate700 },

  // Chart
  chartCard: { marginHorizontal: spacing.lg, backgroundColor: palette.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.sm },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { width: 28, height: 80, borderRadius: 8, backgroundColor: palette.slate100, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 10, color: palette.slate400 },
  barValue: { fontSize: 9, color: palette.slate400 },

  // OS cards
  osCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: palette.white, borderRadius: borderRadius.lg, flexDirection: 'row', overflow: 'hidden', ...shadows.sm },
  osColorBar: { width: 5 },
  osContent: { flex: 1, padding: spacing.md },
  osHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  osNumBox: { backgroundColor: palette.navy50, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  osNumText: { fontSize: 12, fontWeight: '700', color: palette.navy800 },
  statusBadge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  osCliente: { fontSize: 14, fontWeight: '700', color: palette.slate900 },
  osVeiculo: { fontSize: 12, color: palette.slate500, marginTop: 2 },
  osDesc: { fontSize: 12, color: palette.slate400, marginTop: 4 },
  osDivider: { height: 1, backgroundColor: palette.slate100, marginVertical: spacing.sm },
  osFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  osFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  osFooterText: { fontSize: 12, color: palette.slate500 },
  osValor: { fontSize: 15, fontWeight: '800', color: palette.navy800 },

  // Agenda cards
  agCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: palette.white, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', ...shadows.sm, overflow: 'hidden' },
  agTimeBox: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center', justifyContent: 'center', minWidth: 64 },
  agHora: { fontSize: 14, fontWeight: '800', color: palette.white },
  agInfo: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  agCliente: { fontSize: 14, fontWeight: '700', color: palette.slate900 },
  agVeiculo: { fontSize: 12, color: palette.slate500, marginTop: 2 },
  agBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  agBadgeText: { fontSize: 16 },

  // Empty state
  emptyCard: { marginHorizontal: spacing.lg, backgroundColor: palette.white, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, ...shadows.sm },
  emptyText: { fontSize: 14, color: palette.slate400 },
});
