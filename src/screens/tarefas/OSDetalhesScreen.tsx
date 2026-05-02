import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Surface, Button, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { mockOrdens, mockClientes, mockVeiculos, mockServicos } from '../../data/mockData';
import { colors, spacing, borderRadius } from '../../theme/theme';
import dayjs from 'dayjs';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  em_andamento: { label: 'Em Andamento', color: '#1565C0', bg: '#E3F2FD' },
  aguardando: { label: 'Aguardando', color: '#E65100', bg: '#FFF3E0' },
  aguardando_pecas: { label: 'Aguard. Peças', color: '#6A1B9A', bg: '#F3E5F5' },
  concluido: { label: 'Concluído', color: '#2E7D32', bg: '#E8F5E9' },
};

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon} size={18} color={colors.primary} style={{ width: 24 }} />
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
  const os = mockOrdens.find(o => o.id === osId) ?? mockOrdens[0];
  const cliente = mockClientes.find(c => c.id === os.clienteId);
  const veiculo = mockVeiculos.find(v => v.id === os.veiculoId);
  const st = statusConfig[os.status] ?? { label: os.status, color: '#757575', bg: '#F5F5F5' };

  return (
    <ScrollView style={styles.container}>
      {/* Header OS */}
      <View style={styles.headerBox}>
        <View style={styles.headerRow}>
          <Text style={styles.osNum}>OS #{String(os.id).padStart(3, '0')}</Text>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <Text style={styles.descricao}>{os.descricao}</Text>
        <Text style={styles.valor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
      </View>

      {/* Cliente */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <Divider style={{ marginBottom: spacing.md }} />
        <InfoRow icon="person" label="Nome" value={cliente?.nome ?? '—'} />
        <InfoRow icon="phone" label="Telefone" value={cliente?.telefone ?? '—'} />
        <InfoRow icon="email" label="E-mail" value={cliente?.email ?? '—'} />
      </Surface>

      {/* Veículo */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Veículo</Text>
        <Divider style={{ marginBottom: spacing.md }} />
        <InfoRow icon="directions-car" label="Modelo" value={veiculo ? `${veiculo.marca} ${veiculo.modelo} ${veiculo.ano}` : '—'} />
        <InfoRow icon="pin" label="Placa" value={veiculo?.placa ?? '—'} />
        <InfoRow icon="palette" label="Cor" value={veiculo?.cor ?? '—'} />
        <InfoRow icon="speed" label="KM" value={veiculo ? `${veiculo.km.toLocaleString()} km` : '—'} />
      </Surface>

      {/* Datas e Mecânico */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Informações</Text>
        <Divider style={{ marginBottom: spacing.md }} />
        <InfoRow icon="login" label="Entrada" value={dayjs(os.dataEntrada).format('DD/MM/YYYY HH:mm')} />
        <InfoRow icon="event" label="Previsão" value={dayjs(os.dataPrevista).format('DD/MM/YYYY')} />
        <InfoRow icon="engineering" label="Mecânico" value={os.mecanico} />
      </Surface>

      {/* Serviços executados */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Serviços / Peças</Text>
        <Divider style={{ marginBottom: spacing.md }} />
        {[
          { nome: 'Diagnóstico', qtd: 1, valor: 150.0 },
          { nome: 'Mão de Obra', qtd: 1, valor: os.valor - 150 },
        ].map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemNome}>{item.nome}</Text>
              <Text style={styles.itemQtd}>Qtd: {item.qtd}</Text>
            </View>
            <Text style={styles.itemValor}>R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
          </View>
        ))}
        <Divider style={{ marginVertical: spacing.md }} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        </View>
      </Surface>

      {/* Ações */}
      <View style={styles.actions}>
        {os.status !== 'concluido' && (
          <Button mode="contained" buttonColor={colors.primary} style={{ flex: 1 }} onPress={() => {}}>
            Marcar como Concluído
          </Button>
        )}
        <Button mode="outlined" textColor={colors.primary} style={{ flex: 1 }} onPress={() => {}}>
          Gerar PDF
        </Button>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBox: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  osNum: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  descricao: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: spacing.sm },
  valor: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.onBackground, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm, gap: spacing.sm },
  infoLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },
  infoValue: { fontSize: 14, color: colors.onBackground, fontWeight: '500' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  itemNome: { fontSize: 14, fontWeight: '600', color: colors.onBackground },
  itemQtd: { fontSize: 12, color: '#9E9E9E' },
  itemValor: { fontSize: 14, fontWeight: '700', color: colors.onBackground },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.onBackground },
  totalValor: { fontSize: 20, fontWeight: '800', color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.md, margin: spacing.lg },
});
