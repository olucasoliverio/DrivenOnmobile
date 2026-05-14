import React from 'react';
import { Alert, Linking, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../api/api';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  em_andamento:    { label: 'Em Andamento',  color: palette.navy700,    bg: palette.navy50,     icon: 'autorenew' },
  aguardando:      { label: 'Aguardando',    color: '#C2410C',          bg: '#FFF7ED',          icon: 'schedule' },
  aguardando_pecas:{ label: 'Aguard. Peças', color: palette.violet600,  bg: '#F5F3FF',          icon: 'inventory' },
  concluido:       { label: 'Concluído',     color: palette.emerald600, bg: palette.emerald100, icon: 'check-circle' },
};

function InfoRow({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <MaterialIcons name={icon} size={16} color={palette.navy700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function OSDetalhesScreen() {
  const route = useRoute<any>();
  const { osId } = route.params ?? { osId: 1 };
  const { ordens, clientes, veiculos, updateRecord, refresh } = useDriveOnData();
  const os = ordens.find(o => o.id === osId) ?? ordens[0];
  const cliente = os ? clientes.find(c => c.id === os.clienteId) : undefined;
  const veiculo = os ? veiculos.find(v => v.id === os.veiculoId) : undefined;

  if (!os) {
    return (
      <View style={styles.container}>
        <Text>Ordem de servico nao encontrada.</Text>
      </View>
    );
  }
  const st = STATUS_MAP[os.status] ?? { label: os.status, color: palette.slate500, bg: palette.slate100, icon: 'info' as any };

  const itens = [
    { nome: 'Diagnóstico', qtd: 1, valor: 150.0 },
    { nome: 'Mão de Obra', qtd: 1, valor: os.valor - 150 },
  ];

  const concluirOS = () => {
    Alert.alert('Concluir OS?', 'A ordem sera marcada como concluida.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Concluir', onPress: async () => {
        try {
          await updateRecord('/ordens', os.id, {
            status: 'concluida',
            data_fechamento: new Date().toISOString(),
          });
          await refresh();
        } catch (error: any) {
          Alert.alert('Nao foi possivel concluir', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
        }
      } },
    ]);
  };

  const abrirPdf = async () => {
    const url = `${API_BASE_URL}/ordens/${os.id}/pdf`;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert('PDF indisponivel', url);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Hero Card ── */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.osNumBox}>
            <Text style={styles.osNumText}>OS #{String(os.id).padStart(3, '0')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <MaterialIcons name={st.icon} size={12} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <Text style={styles.descricao}>{os.descricao}</Text>
        <View style={styles.valorRow}>
          <Text style={styles.valorLabel}>Total</Text>
          <Text style={styles.valor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      {/* ── Cliente ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="person" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Cliente</Text>
        </View>
        <InfoRow icon="person-outline" label="Nome" value={cliente?.nome ?? '—'} />
        <InfoRow icon="phone" label="Telefone" value={cliente?.telefone ?? '—'} />
        <InfoRow icon="email" label="E-mail" value={cliente?.email ?? '—'} />
      </View>

      {/* ── Veículo ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="directions-car" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Veículo</Text>
        </View>
        <InfoRow icon="car-repair" label="Modelo" value={veiculo ? `${veiculo.marca} ${veiculo.modelo} ${veiculo.ano}` : '—'} />
        <InfoRow icon="pin" label="Placa" value={veiculo?.placa ?? '—'} />
        <InfoRow icon="palette" label="Cor" value={veiculo?.cor ?? '—'} />
        <InfoRow icon="speed" label="KM" value={veiculo ? `${veiculo.km.toLocaleString()} km` : '—'} />
      </View>

      {/* ── Informações ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="info-outline" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Informações</Text>
        </View>
        <InfoRow icon="login" label="Entrada" value={dayjs(os.dataEntrada).format('DD/MM/YYYY HH:mm')} />
        <InfoRow icon="event" label="Previsão" value={dayjs(os.dataPrevista).format('DD/MM/YYYY')} />
        <InfoRow icon="engineering" label="Mecânico" value={os.mecanico} />
      </View>

      {/* ── Serviços / Peças ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="build" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Serviços / Peças</Text>
        </View>
        {itens.map((item, idx) => (
          <View key={idx} style={[styles.itemRow, idx < itens.length - 1 && styles.itemBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemNome}>{item.nome}</Text>
              <Text style={styles.itemQtd}>Qtd: {item.qtd}</Text>
            </View>
            <Text style={styles.itemValor}>R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      {/* ── Ações ── */}
      <View style={styles.actions}>
        {os.status !== 'concluido' && (
          <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.8} onPress={concluirOS}>
            <LinearGradient colors={gradients.navyPrimary} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <MaterialIcons name="check-circle" size={18} color={palette.white} />
              <Text style={styles.btnPrimaryText}>Marcar como Concluído</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.btnOutline} activeOpacity={0.7} onPress={abrirPdf}>
          <MaterialIcons name="picture-as-pdf" size={18} color={palette.navy800} />
          <Text style={styles.btnOutlineText}>Gerar PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  // Hero card
  heroCard: { margin: spacing.lg, backgroundColor: palette.white, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  osNumBox: { backgroundColor: palette.navy50, borderRadius: borderRadius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  osNumText: { fontSize: 15, fontWeight: '800', color: palette.navy800 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  descricao: { fontSize: 15, color: palette.slate500, marginBottom: spacing.md, lineHeight: 22 },
  valorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: palette.slate100 },
  valorLabel: { fontSize: 13, color: palette.slate500, fontWeight: '600' },
  valor: { fontSize: 24, fontWeight: '800', color: palette.navy800 },

  // Sections
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: palette.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: palette.slate100 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: palette.slate900 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm, gap: spacing.sm },
  infoIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: palette.navy50, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: palette.slate400, fontWeight: '600', marginBottom: 1 },
  infoValue: { fontSize: 14, color: palette.slate900, fontWeight: '500' },

  // Item rows (serviços)
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: palette.slate100 },
  itemNome: { fontSize: 14, fontWeight: '600', color: palette.slate900 },
  itemQtd: { fontSize: 12, color: palette.slate400, marginTop: 1 },
  itemValor: { fontSize: 14, fontWeight: '700', color: palette.slate700 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, marginTop: spacing.xs, borderTopWidth: 2, borderTopColor: palette.slate100 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: palette.slate900 },
  totalValor: { fontSize: 20, fontWeight: '800', color: palette.navy800 },

  // Actions
  actions: { marginHorizontal: spacing.lg, gap: spacing.sm },
  btnPrimary: { borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.sm },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14 },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: palette.white },
  btnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: palette.navy800, backgroundColor: palette.white },
  btnOutlineText: { fontSize: 15, fontWeight: '700', color: palette.navy800 },
});
