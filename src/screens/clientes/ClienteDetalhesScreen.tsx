import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Surface, Divider, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { mockClientes, mockVeiculos, mockOrdens, mockPagamentos } from '../../data/mockData';
import { colors, spacing, borderRadius } from '../../theme/theme';
import dayjs from 'dayjs';

const statusConfig: Record<string, { label: string; color: string }> = {
  em_andamento: { label: 'Em Andamento', color: '#1565C0' },
  aguardando: { label: 'Aguardando', color: '#E65100' },
  aguardando_pecas: { label: 'Aguard. Peças', color: '#6A1B9A' },
  concluido: { label: 'Concluído', color: '#2E7D32' },
};

export default function ClienteDetalhesScreen() {
  const route = useRoute<any>();
  const { clienteId } = route.params ?? { clienteId: 1 };
  const cliente = mockClientes.find(c => c.id === clienteId) ?? mockClientes[0];
  const veiculos = mockVeiculos.filter(v => v.clienteId === cliente.id);
  const ordens = mockOrdens.filter(o => o.clienteId === cliente.id);
  const pagamentos = mockPagamentos.filter(p => p.clienteId === cliente.id);
  const totalGasto = pagamentos.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{cliente.nome.substring(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={styles.nome}>{cliente.nome}</Text>
        <Text style={styles.cpf}>{cliente.cpf}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statNum}>{veiculos.length}</Text><Text style={styles.statLabel}>Veículos</Text></View>
          <View style={[styles.statBox, styles.statDivider]}><Text style={styles.statNum}>{ordens.length}</Text><Text style={styles.statLabel}>OS</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>R$ {(totalGasto / 1000).toFixed(1)}k</Text><Text style={styles.statLabel}>Total Gasto</Text></View>
        </View>
      </View>

      {/* Contato */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Contato</Text>
        <Divider style={{ marginBottom: spacing.md }} />
        {[
          { icon: 'phone', value: cliente.telefone },
          { icon: 'email', value: cliente.email },
          { icon: 'location-on', value: `${cliente.endereco}, ${cliente.cidade}` },
        ].map((item) => (
          <View key={item.value} style={styles.infoRow}>
            <MaterialIcons name={item.icon as any} size={18} color={colors.primary} />
            <Text style={styles.infoText}>{item.value}</Text>
          </View>
        ))}
      </Surface>

      {/* Veículos */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Veículos ({veiculos.length})</Text>
        <Divider style={{ marginBottom: spacing.md }} />
        {veiculos.map(v => (
          <View key={v.id} style={styles.veiculoCard}>
            <MaterialIcons name="directions-car" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.veiculoNome}>{v.marca} {v.modelo} {v.ano}</Text>
              <Text style={styles.veiculoInfo}>{v.placa} • {v.cor} • {v.km.toLocaleString()} km</Text>
            </View>
          </View>
        ))}
        {veiculos.length === 0 && <Text style={styles.emptyText}>Nenhum veículo cadastrado</Text>}
      </Surface>

      {/* Histórico OS */}
      <Surface style={styles.section} elevation={1}>
        <Text style={styles.sectionTitle}>Histórico de OS ({ordens.length})</Text>
        <Divider style={{ marginBottom: spacing.md }} />
        {ordens.map(os => {
          const st = statusConfig[os.status];
          return (
            <View key={os.id} style={styles.osRow}>
              <Text style={styles.osNum}>#{String(os.id).padStart(3, '0')}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.osDesc} numberOfLines={1}>{os.descricao}</Text>
                <Text style={styles.osData}>{dayjs(os.dataEntrada).format('DD/MM/YYYY')}</Text>
              </View>
              <View>
                <Text style={[styles.osStatus, { color: st?.color }]}>{st?.label}</Text>
                <Text style={styles.osValor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
          );
        })}
        {ordens.length === 0 && <Text style={styles.emptyText}>Nenhuma ordem de serviço</Text>}
      </Surface>

      <View style={styles.actions}>
        <Button mode="contained" buttonColor={colors.primary} style={{ flex: 1 }} onPress={() => {}}>
          Nova OS
        </Button>
        <Button mode="outlined" textColor={colors.primary} style={{ flex: 1 }} onPress={() => {}}>
          Editar
        </Button>
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, padding: spacing.lg, alignItems: 'center' },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 24 },
  nome: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  cpf: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: spacing.lg, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.md, padding: spacing.md, gap: spacing.md },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.onBackground, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  infoText: { fontSize: 14, color: colors.onBackground },
  veiculoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm, padding: spacing.sm, backgroundColor: '#F8F9FA', borderRadius: borderRadius.sm },
  veiculoNome: { fontSize: 14, fontWeight: '600', color: colors.onBackground },
  veiculoInfo: { fontSize: 12, color: '#757575', marginTop: 2 },
  osRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  osNum: { fontSize: 13, fontWeight: '700', color: colors.primary, width: 36 },
  osDesc: { fontSize: 13, fontWeight: '600', color: colors.onBackground },
  osData: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  osStatus: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
  osValor: { fontSize: 13, fontWeight: '700', color: colors.onBackground, textAlign: 'right' },
  emptyText: { fontSize: 13, color: '#9E9E9E', fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: spacing.md, margin: spacing.lg },
});
