import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import EmptyState from '../../components/EmptyState';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

const { width } = Dimensions.get('window');

// ─── Status Config ───────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; progress: number }> = {
  aguardando:       { label: 'Aguardando',     color: palette.slate500,   bg: palette.slate50,   progress: 0.15 },
  em_andamento:     { label: 'Em Andamento',   color: palette.navy800,    bg: 'rgba(15, 23, 42, 0.04)', progress: 0.55 },
  aguardando_pecas: { label: 'Aguard. Peças',  color: palette.slate500,   bg: palette.slate50,   progress: 0.35 },
  concluido:        { label: 'Concluído',      color: palette.slate500,   bg: palette.slate50,   progress: 1.0 },
};

// ─── KPI Horizontal Card ─────────────────────────────────────────────────────
type IconName = keyof typeof MaterialIcons.glyphMap;
function KpiChip({ icon, label, value }: {
  icon: IconName; label: string; value: string;
}) {
  return (
    <View style={styles.kpiChip}>
      <View style={styles.kpiIconBox}>
        <MaterialIcons name={icon} size={18} color={palette.slate500} />
      </View>
      <View style={styles.kpiChipBody}>
        <Text style={styles.kpiChipValue}>{value}</Text>
        <Text style={styles.kpiChipLabel}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Quick Action Button ─────────────────────────────────────────────────────
function QuickAction({ icon, label, color, onPress }: {
  icon: IconName; label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <MaterialIcons name={icon} size={20} color={palette.white} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    dashboard: d,
    ordens,
    agendamentos,
    clientes,
    veiculos,
    pagamentos,
    configuracoes,
    refresh,
  } = useDriveOnData();
  const [refreshing, setRefreshing] = React.useState(false);

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

  const ordensAbertas = ordens.filter(o => o.status !== 'concluido' && o.status !== 'cancelada');
  const agendamentosHoje = agendamentos.filter(a => dayjs(a.data).isSame(dayjs(), 'day'));
  const hora = dayjs().hour();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const nomeOficina = configuracoes?.nomeOficina || 'DriveOn';

  // ── Atividade Recente (sintética a partir dos dados) ──
  const atividadeRecente = React.useMemo(() => {
    const items: { id: string; icon: IconName; iconColor: string; iconBg: string; title: string; sub: string; date: string; screen: string; params?: any }[] = [];
    
    // Últimas OS
    ordens.slice(-5).forEach(os => {
      const cliente = clientes.find(c => c.id === os.clienteId);
      const st = STATUS_MAP[os.status];
      items.push({
        id: `os-${os.id}`,
        icon: 'build',
        iconColor: st?.color ?? palette.slate500,
        iconBg: st?.bg ?? palette.slate100,
        title: `OS #${String(os.id).padStart(3, '0')} — ${st?.label ?? os.status}`,
        sub: cliente?.nome ?? 'Cliente',
        date: os.dataEntrada,
        screen: 'OSDetalhes',
        params: { osId: os.id },
      });
    });

    // Últimos clientes
    clientes.slice(-3).forEach(c => {
      items.push({
        id: `cli-${c.id}`,
        icon: 'person-add',
        iconColor: palette.navy800,
        iconBg: 'rgba(37, 99, 235, 0.08)',
        title: `Novo cliente cadastrado`,
        sub: c.nome,
        date: dayjs().subtract(1, 'day').toISOString(),
        screen: 'ClienteDetalhes',
        params: { clienteId: c.id },
      });
    });

    // Últimos pagamentos recebidos
    pagamentos.filter(p => p.status === 'pago').slice(-3).forEach(p => {
      items.push({
        id: `pag-${p.id}`,
        icon: 'payments',
        iconColor: palette.emerald600,
        iconBg: 'rgba(16, 185, 129, 0.08)',
        title: `Pagamento recebido`,
        sub: `R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        date: p.data,
        screen: 'OSDetalhes',
        params: { osId: p.ordemId },
      });
    });

    return items
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
      .slice(0, 5);
  }, [ordens, clientes, pagamentos]);

  // ── KPI data ──
  const variacao = d.receitaAnterior > 0 
    ? ((d.receitaMes - d.receitaAnterior) / d.receitaAnterior * 100).toFixed(1) 
    : '0.0';

  const kpis = [
    { icon: 'attach-money' as IconName, label: 'Receita', value: `R$ ${(d.receitaMes / 1000).toFixed(1)}k` },
    { icon: 'build' as IconName, label: 'OS Abertas', value: String(ordensAbertas.length) },
    { icon: 'event' as IconName, label: 'Agenda Hoje', value: String(agendamentosHoje.length) },
    { icon: 'people' as IconName, label: 'Clientes', value: String(clientes.length) },
    { icon: 'directions-car' as IconName, label: 'Veículos', value: String(veiculos.length) },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[palette.navy800]} />
      }
    >

      {/* ── Header ── */}
      <LinearGradient colors={gradients.navyDark} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{saudacao}!</Text>
            <Text style={styles.dateText}>{nomeOficina} · {dayjs().format('dddd, D [de] MMMM')}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={[palette.navy600, palette.navy800]} style={styles.avatarCircle}>
              <Text style={styles.avatarText}>AD</Text>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>

      {/* ── KPIs Horizontal Scroll (comentado por ora) ──
      <FlatList
        data={kpis}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `kpi-${i}`}
        contentContainerStyle={styles.kpiList}
        style={styles.kpiContainer}
        renderItem={({ item }) => (
          <KpiChip
            icon={item.icon}
            label={item.label}
            value={item.value}
          />
        )}
      />
      */}

      {/* ── Atalhos Rápidos ── */}
      <View style={[styles.quickActionsRow, { marginTop: spacing.lg }]}>
        <QuickAction icon="build" label="Nova OS" color={palette.slate500} onPress={() => navigation.navigate('OS', { screen: 'TarefasList', params: { openForm: true } })} />
        <QuickAction icon="person-add" label="Novo Cliente" color={palette.slate500} onPress={() => navigation.navigate('Clientes', { openForm: true })} />
        <QuickAction icon="event" label="Agendar" color={palette.slate500} onPress={() => navigation.navigate('Agenda', { openForm: true })} />
        <QuickAction icon="directions-car" label="Veículos" color={palette.slate500} onPress={() => navigation.navigate('Veiculos', { openForm: true })} />
      </View>

      {/* ── OS em Andamento ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>OS em Andamento</Text>
          </View>
          <View style={[styles.sectionBadge, { backgroundColor: 'rgba(37, 99, 235, 0.08)' }]}>  
            <Text style={[styles.sectionBadgeText, { color: palette.navy800 }]}>{ordensAbertas.length} ativas</Text>
          </View>
        </View>
        {ordensAbertas.length === 0 ? (
          <EmptyState icon="build" message="Nenhuma OS em andamento" />
        ) : (
          ordensAbertas.slice(0, 5).map((os) => {
            const cliente = clientes.find(c => c.id === os.clienteId);
            const veiculo = veiculos.find(v => v.id === os.veiculoId);
            const s = STATUS_MAP[os.status] ?? { color: palette.slate400, bg: palette.slate100, progress: 0, label: os.status };
            return (
              <TouchableOpacity
                key={os.id}
                style={styles.osCard}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('OSDetalhes', { osId: os.id })}
              >
                <View style={styles.osContent}>
                  <View style={styles.osHeader}>
                    <View style={styles.osNumBox}>
                      <Text style={styles.osNumText}>OS #{String(os.id).padStart(3, '0')}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                      <Text style={[styles.statusBadgeText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.osCliente}>{cliente?.nome ?? '—'}</Text>
                  <Text style={styles.osVeiculo}>
                    {veiculo ? `${veiculo.marca} ${veiculo.modelo} · ${veiculo.placa}` : '—'}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${s.progress * 100}%`, backgroundColor: s.color }]} />
                    </View>
                    <Text style={[styles.progressText, { color: s.color }]}>{Math.round(s.progress * 100)}%</Text>
                  </View>

                  <View style={styles.osFooter}>
                    <View style={styles.osFooterLeft}>
                      <MaterialIcons name="event" size={13} color={palette.slate400} />
                      <Text style={styles.osFooterText}>{dayjs(os.dataPrevista).format('DD/MM/YY')}</Text>
                    </View>
                    <Text style={styles.osValor}>
                      R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
                <View style={styles.osChevron}>
                  <MaterialIcons name="chevron-right" size={20} color={palette.slate300} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* ── Agenda de Hoje ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agenda de Hoje</Text>
          <View style={[styles.sectionBadge, agendamentosHoje.length > 0 && { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
            <Text style={[styles.sectionBadgeText, agendamentosHoje.length > 0 && { color: palette.emerald600 }]}>
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
            const accentColor = isConfirmado ? palette.emerald600 : palette.amber500;
            return (
              <View key={ag.id} style={styles.agCard}>
                <View style={styles.agTimeCol}>
                  <Text style={styles.agTime}>{ag.hora}</Text>
                  <View style={[styles.agDot, { backgroundColor: accentColor }]} />
                </View>
                <View style={styles.agInfo}>
                  <Text style={styles.agCliente}>{cliente?.nome}</Text>
                  <Text style={styles.agServico} numberOfLines={1}>
                    {veiculo ? `${veiculo.marca} ${veiculo.modelo}` : ''} · {ag.servico}
                  </Text>
                </View>
                <View style={[styles.agBadge, { backgroundColor: isConfirmado ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)' }]}>
                  <Text style={[styles.agBadgeText, { color: accentColor }]}>
                    {isConfirmado ? 'Confirmado' : 'Pendente'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ── Atividade Recente ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Atividade Recente</Text>
        </View>
        {atividadeRecente.length === 0 ? (
          <EmptyState icon="history" message="Nenhuma atividade recente" />
        ) : (
          <View style={styles.activityCard}>
            {atividadeRecente.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.activityRow, idx < atividadeRecente.length - 1 && styles.activityRowBorder]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(item.screen as any, item.params)}
              >
                <View style={[styles.activityIconBox, { backgroundColor: item.iconBg }]}>
                  <MaterialIcons name={item.icon} size={16} color={item.iconColor} />
                </View>
                <View style={styles.activityBody}>
                  <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.activitySub} numberOfLines={1}>{item.sub}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={16} color={palette.slate300} />
                <Text style={styles.activityDate}>{dayjs(item.date).format('DD/MM')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Bottom spacing for tab bar */}
      <View style={{ height: insets.bottom + 90 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  // Header
  header: {
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  headerCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.02)', top: -60, right: -50 },
  headerCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.02)', bottom: -30, left: -30 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg },
  greeting: { fontSize: 24, fontWeight: '900', color: palette.white, letterSpacing: -0.5 },
  dateText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontWeight: '600' },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  avatarText: { color: palette.white, fontWeight: '900', fontSize: 14 },

  // KPI horizontal scroll
  kpiContainer: { marginTop: -2 },
  kpiList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  kpiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    gap: spacing.sm,
    minWidth: 150,
    ...shadows.sm,
  },
  kpiIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.slate50 },
  kpiChipBody: { flex: 1 },
  kpiChipValue: { fontSize: 18, fontWeight: '900', color: palette.slate900, letterSpacing: -0.3 },
  kpiChipLabel: { fontSize: 10, color: palette.slate400, fontWeight: '700', marginTop: 1 },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  quickAction: { alignItems: 'center', gap: 6 },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActionLabel: { fontSize: 10, fontWeight: '700', color: palette.slate500 },

  // Sections
  section: { marginTop: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: palette.slate900, letterSpacing: -0.2 },
  sectionBadge: { backgroundColor: palette.white, borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(15, 23, 42, 0.04)' },
  sectionBadgeText: { fontSize: 10, fontWeight: '800', color: palette.slate500 },

  // OS cards
  osCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: palette.slate200,
    overflow: 'hidden',
    ...shadows.sm,
  },
  osContent: { flex: 1, padding: spacing.md },
  osHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  osNumBox: { backgroundColor: palette.slate50, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  osNumText: { fontSize: 10, fontWeight: '800', color: palette.slate500 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  osCliente: { fontSize: 14, fontWeight: '800', color: palette.slate900, letterSpacing: -0.2 },
  osVeiculo: { fontSize: 11, color: palette.slate400, marginTop: 1, fontWeight: '500' },

  // Progress bar
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: palette.slate100, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 10, fontWeight: '800', minWidth: 30, textAlign: 'right' },

  osFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  osFooterLeft: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  osFooterText: { fontSize: 11, color: palette.slate400, fontWeight: '500' },
  osValor: { fontSize: 14, fontWeight: '900', color: palette.navy900 },
  osChevron: { justifyContent: 'center', alignItems: 'center', paddingRight: spacing.sm },

  // Agenda
  agCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: palette.slate200,
    paddingVertical: 10,
    ...shadows.sm,
  },
  agTimeCol: { paddingLeft: spacing.md, alignItems: 'center', minWidth: 60 },
  agTime: { fontSize: 14, fontWeight: '900', color: palette.slate900 },
  agDot: { width: 6, height: 6, borderRadius: 3, marginTop: 3 },
  agInfo: { flex: 1, paddingHorizontal: spacing.sm },
  agCliente: { fontSize: 13, fontWeight: '800', color: palette.slate900 },
  agServico: { fontSize: 11, color: palette.slate400, marginTop: 1, fontWeight: '500' },
  agBadge: { borderRadius: borderRadius.full, paddingHorizontal: 9, paddingVertical: 3, marginRight: spacing.md },
  agBadgeText: { fontSize: 10, fontWeight: '800' },

  // Activity
  activityCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, gap: spacing.sm },
  activityRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(15, 23, 42, 0.04)' },
  activityIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  activityBody: { flex: 1 },
  activityTitle: { fontSize: 12, fontWeight: '700', color: palette.slate900 },
  activitySub: { fontSize: 11, color: palette.slate400, fontWeight: '500', marginTop: 1 },
  activityDate: { fontSize: 10, color: palette.slate400, fontWeight: '700' },
});
