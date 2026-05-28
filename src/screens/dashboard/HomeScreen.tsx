import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import EmptyState from '../../components/EmptyState';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2 - spacing.sm * 3) / 2;

// ─── Status Badge (Estilo pastel moderno com indicador dot) ───────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  em_andamento:    { label: 'Em Andamento',   color: palette.navy800,    bg: 'rgba(37, 99, 235, 0.08)' },
  aguardando:      { label: 'Aguardando',     color: '#C2410C',          bg: '#FFF7ED' },
  aguardando_pecas:{ label: 'Aguard. Peças',  color: palette.violet600,  bg: '#F5F3FF' },
  concluido:       { label: 'Concluído',      color: palette.emerald600, bg: '#ECFDF5' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: palette.slate500, bg: palette.slate100 };
  return (
    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: s.color }]} />
      <Text style={[styles.statusBadgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

// ─── KPI Card (Visual clean com ícone flutuante sutil) ────────────────────────
type IconName = keyof typeof MaterialIcons.glyphMap;
function KpiCard({ icon, label, value, sub, iconBg, iconColor }: {
  icon: IconName; label: string; value: string; sub?: string; iconBg: string; iconColor: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiHeaderRow}>
        <View style={[styles.kpiIconBox, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>
        {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
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
  
  const variacao = ((d.receitaMes - d.receitaAnterior) / d.receitaAnterior * 100).toFixed(1);
  const ordensAbertas = ordens.filter(o => o.status !== 'concluido');
  const agendamentosHoje = agendamentos.filter(a => dayjs(a.data).isSame(dayjs(), 'day'));
  const maxReceita = Math.max(...d.receitaMensal.map(r => r.valor));
  const hora = dayjs().hour();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Header Gradiente Moderno ── */}
      <LinearGradient colors={gradients.navyDark} style={[styles.header, { paddingTop: insets.top + 16 }]}>
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

        {/* KPIs Grid no Header */}
        <View style={styles.kpiGrid}>
          <KpiCard
            icon="attach-money"
            label="Receita"
            value={`R$ ${(d.receitaMes / 1000).toFixed(1)}k`}
            sub={`+${variacao}%`}
            iconBg="rgba(245,158,11,0.15)"
            iconColor={palette.amber400}
          />
          <KpiCard
            icon="build"
            label="OS Abertas"
            value={String(d.osAbertas)}
            sub={`${d.osConcluidas} ok`}
            iconBg="rgba(255,255,255,0.08)"
            iconColor={palette.white}
          />
          <KpiCard
            icon="event"
            label="Agenda Hoje"
            value={String(agendamentosHoje.length)}
            iconBg="rgba(16,185,129,0.15)"
            iconColor="#34D399"
          />
          <KpiCard
            icon="people"
            label="Clientes"
            value={String(d.clientesAtivos)}
            iconBg="rgba(167,139,250,0.15)"
            iconColor="#A78BFA"
          />
        </View>
      </LinearGradient>

      {/* ── Gráfico de Receita Redesenhado ── */}
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
                  <Text style={[styles.barValue, isActive && styles.barValueActive]}>
                    {(item.valor / 1000).toFixed(0)}k
                  </Text>
                  <View style={styles.barTrack}>
                    {isActive ? (
                      <LinearGradient
                        colors={gradients.navyPrimary}
                        style={[styles.barFill, { height: `${pct}%`, borderTopLeftRadius: 4, borderTopRightRadius: 4 }]}
                      />
                    ) : (
                      <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: palette.slate300, borderTopLeftRadius: 4, borderTopRightRadius: 4 }]} />
                    )}
                  </View>
                  <Text style={[styles.barLabel, isActive && styles.barLabelActive]}>
                    {item.mes}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── OS em Andamento Redesenhada ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OS em Andamento</Text>
          <View style={[styles.sectionBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
            <Text style={[styles.sectionBadgeText, { color: '#B45309' }]}>{ordensAbertas.length} abertas</Text>
          </View>
        </View>
        {ordensAbertas.length === 0 ? (
          <EmptyState icon="build" message="Nenhuma OS em andamento" />
        ) : (
          ordensAbertas.map((os) => {
          const cliente = clientes.find(c => c.id === os.clienteId);
          const veiculo = veiculos.find(v => v.id === os.veiculoId);
          return (
            <TouchableOpacity key={os.id} style={styles.osCard} activeOpacity={0.8}>
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
                    <MaterialIcons name="event" size={14} color={palette.slate400} />
                    <Text style={styles.osFooterText}>{dayjs(os.dataPrevista).format('DD [de] MMM')}</Text>
                  </View>
                  <Text style={styles.osValor}>
                    R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }))}
      </View>

      {/* ── Agenda de Hoje (Estilo Timeline Moderno) ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agenda de Hoje</Text>
          <View style={[styles.sectionBadge, agendamentosHoje.length > 0 && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Text style={[styles.sectionBadgeText, agendamentosHoje.length > 0 && { color: '#059669' }]}>
              {agendamentosHoje.length} {agendamentosHoje.length === 1 ? 'evento' : 'eventos'}
            </Text>
          </View>
        </View>
        {agendamentosHoje.length === 0 ? (
          <EmptyState icon="event-available" message="Nenhum agendamento para hoje" />
        ) : (
          agendamentosHoje.map((ag) => {
            const cliente = clientes.find(c => c.id === ag.clienteId);
            const veiculo = veiculos.find(v => v.id === ag.veiculoId);
            const isConfirmado = ag.status === 'confirmado';
            return (
              <View key={ag.id} style={styles.agCard}>
                <View style={styles.agTimelineColumn}>
                  <Text style={styles.agTimeText}>{ag.hora}</Text>
                  <View style={[styles.agIndicatorLine, { backgroundColor: isConfirmado ? palette.emerald600 : palette.amber500 }]} />
                </View>
                <View style={styles.agInfo}>
                  <Text style={styles.agCliente}>{cliente?.nome}</Text>
                  <Text style={styles.agVeiculo}>
                    {veiculo ? `${veiculo.marca} ${veiculo.modelo}` : ''} · {ag.servico}
                  </Text>
                </View>
                <View style={[styles.agBadge, { backgroundColor: isConfirmado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                  <Text style={[styles.agBadgeText, { color: isConfirmado ? palette.emerald600 : palette.amber500 }]}>
                    {isConfirmado ? 'Confirmado' : 'Aguardando'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Margem inferior generosa para não cobrir com o Tab Bar flutuante */}
      <View style={{ height: 110 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  // Header
  header: { paddingBottom: 28, overflow: 'hidden' },
  headerCircle1: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.03)', top: -80, right: -60 },
  headerCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.03)', bottom: -40, left: -40 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  greeting: { fontSize: 26, fontWeight: '900', color: palette.white, letterSpacing: -0.5 },
  dateText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 2, textTransform: 'capitalize' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: palette.white, fontWeight: '800', fontSize: 14 },

  // KPI grid (2×2 no header)
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm },
  kpiCard: { width: CARD_WIDTH, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', ...shadows.sm },
  kpiHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  kpiIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  kpiValue: { fontSize: 20, fontWeight: '900', color: palette.white, letterSpacing: -0.5 },
  kpiLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 2 },
  kpiSub: { fontSize: 10, color: '#34D399', fontWeight: '700' },

  // Sections
  section: { marginTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: palette.slate900, letterSpacing: -0.2 },
  sectionBadge: { backgroundColor: palette.slate100, borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 3 },
  sectionBadgeText: { fontSize: 11, fontWeight: '700', color: palette.slate500 },

  // Chart Card
  chartCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    ...shadows.sm,
  },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, paddingHorizontal: 4 },
  barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { width: 16, height: 80, borderRadius: 4, backgroundColor: '#F1F5F9', justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%' },
  barLabel: { fontSize: 10, color: palette.slate400, marginTop: 2, fontWeight: '600' },
  barLabelActive: { color: palette.navy800, fontWeight: '800' },
  barValue: { fontSize: 9, color: palette.slate400, marginBottom: 2, fontWeight: '600' },
  barValueActive: { color: palette.navy800, fontWeight: '800' },

  // OS cards
  osCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  osContent: { flex: 1, padding: spacing.md },
  osHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  osNumBox: { backgroundColor: palette.slate100, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  osNumText: { fontSize: 11, fontWeight: '800', color: palette.slate500 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  osCliente: { fontSize: 15, fontWeight: '800', color: palette.slate900 },
  osVeiculo: { fontSize: 12, color: palette.slate500, marginTop: 2, fontWeight: '500' },
  osDesc: { fontSize: 12, color: palette.slate400, marginTop: 6, fontWeight: '500' },
  osDivider: { height: 1, backgroundColor: 'rgba(15, 23, 42, 0.05)', marginVertical: spacing.sm },
  osFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  osFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  osFooterText: { fontSize: 12, color: palette.slate500, fontWeight: '500' },
  osValor: { fontSize: 15, fontWeight: '900', color: palette.navy800 },

  // Agenda cards (Timeline)
  agCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    ...shadows.sm,
    paddingVertical: spacing.sm,
  },
  agTimelineColumn: {
    paddingLeft: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  agTimeText: { fontSize: 15, fontWeight: '900', color: palette.slate900 },
  agIndicatorLine: { width: 3, height: 22, borderRadius: 1.5, marginTop: 4 },
  agInfo: { flex: 1, paddingHorizontal: spacing.md },
  agCliente: { fontSize: 14, fontWeight: '800', color: palette.slate900 },
  agVeiculo: { fontSize: 12, color: palette.slate500, marginTop: 2, fontWeight: '500' },
  agBadge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4, marginRight: spacing.md },
  agBadgeText: { fontSize: 11, fontWeight: '800' },

  // Empty state
  emptyCard: { marginHorizontal: spacing.lg, backgroundColor: palette.white, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, ...shadows.sm },
  emptyText: { fontSize: 14, color: palette.slate400, fontWeight: '500' },
});

