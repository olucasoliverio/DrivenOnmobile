import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  em_andamento:    { label: 'Em Andamento', color: palette.navy700 },
  aguardando:      { label: 'Aguardando',   color: '#C2410C' },
  aguardando_pecas:{ label: 'Aguard. Peças',color: palette.violet600 },
  concluido:       { label: 'Concluído',    color: palette.emerald600 },
};

const AVATAR_COLORS = [
  [palette.navy800, palette.navy600],
  ['#7C3AED', '#A855F7'],
  ['#059669', '#10B981'],
] as [string, string][];

const editFields: CrudField[] = [
  { key: 'nome', label: 'Nome', autoCapitalize: 'words' },
  { key: 'telefone', label: 'Telefone', keyboardType: 'phone-pad' },
  { key: 'email', label: 'E-mail', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'observacoes', label: 'Observacoes', multiline: true },
];

export default function ClienteDetalhesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { clienteId } = route.params ?? { clienteId: 1 };
  const { clientes, veiculos: veiculosData, ordens: ordensData, pagamentos, updateRecord } = useDriveOnData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const cliente = clientes.find(c => c.id === clienteId) ?? clientes[0];
  const veiculos = cliente ? veiculosData.filter(v => v.clienteId === cliente.id) : [];
  const ordens = cliente ? ordensData.filter(o => o.clienteId === cliente.id) : [];
  const pagamentosCliente = cliente ? pagamentos.filter(p => p.clienteId === cliente.id) : [];
  const totalGasto = pagamentosCliente.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0);
  const avatarColors = AVATAR_COLORS[clienteId % AVATAR_COLORS.length];

  if (!cliente) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Cliente nao encontrado.</Text>
      </View>
    );
  }

  const openEdit = () => {
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email,
      observacoes: '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.nome?.trim()) {
      Alert.alert('Nome obrigatorio', 'Informe o nome do cliente.');
      return;
    }
    setSaving(true);
    try {
      await updateRecord('/clientes', cliente.id, {
        nome: form.nome.trim(),
        telefone: form.telefone?.trim() || null,
        email: form.email?.trim() || null,
        observacoes: form.observacoes?.trim() || null,
      });
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Nao foi possivel salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Perfil do cliente ── */}
      <View style={styles.profileCard}>
        <LinearGradient colors={avatarColors} style={styles.avatar}>
          <Text style={styles.avatarText}>{cliente.nome.substring(0, 2).toUpperCase()}</Text>
        </LinearGradient>
        <Text style={styles.nome}>{cliente.nome}</Text>
        <Text style={styles.cpf}>{cliente.cpf}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{veiculos.length}</Text>
            <Text style={styles.statLabel}>Veículos</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={styles.statNum}>{ordens.length}</Text>
            <Text style={styles.statLabel}>OS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>R$ {(totalGasto / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Total Gasto</Text>
          </View>
        </View>
      </View>

      {/* ── Contato ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="contacts" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Contato</Text>
        </View>
        {[
          { icon: 'phone' as const,       label: 'Telefone',  value: cliente.telefone },
          { icon: 'email' as const,       label: 'E-mail',    value: cliente.email },
          { icon: 'location-on' as const, label: 'Endereço',  value: `${cliente.endereco}, ${cliente.cidade}` },
        ].map(item => (
          <View key={item.label} style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <MaterialIcons name={item.icon} size={16} color={palette.navy700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Veículos ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="directions-car" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Veículos ({veiculos.length})</Text>
        </View>
        {veiculos.map(v => (
          <View key={v.id} style={styles.veiculoCard}>
            <View style={styles.veiculoIconBox}>
              <MaterialIcons name="directions-car" size={18} color={palette.navy700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.veiculoNome}>{v.marca} {v.modelo} {v.ano}</Text>
              <Text style={styles.veiculoInfo}>{v.placa} · {v.cor} · {v.km.toLocaleString()} km</Text>
            </View>
          </View>
        ))}
        {veiculos.length === 0 && (
          <Text style={styles.emptyText}>Nenhum veículo cadastrado</Text>
        )}
      </View>

      {/* ── Histórico OS ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="build" size={16} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Histórico de OS ({ordens.length})</Text>
        </View>
        {ordens.map((os, idx) => {
          const st = STATUS_MAP[os.status];
          return (
            <View key={os.id} style={[styles.osRow, idx < ordens.length - 1 && styles.osRowBorder]}>
              <View style={styles.osNumBox}>
                <Text style={styles.osNum}>#{String(os.id).padStart(3, '0')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.osDesc} numberOfLines={1}>{os.descricao}</Text>
                <Text style={styles.osData}>{dayjs(os.dataEntrada).format('DD/MM/YYYY')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.osStatus, { color: st?.color }]}>{st?.label}</Text>
                <Text style={styles.osValor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
          );
        })}
        {ordens.length === 0 && (
          <Text style={styles.emptyText}>Nenhuma ordem de serviço</Text>
        )}
      </View>

      {/* ── Ações ── */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.8} onPress={() => navigation.navigate('OS')}>
          <LinearGradient colors={gradients.navyPrimary} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <MaterialIcons name="build" size={18} color={palette.white} />
            <Text style={styles.btnPrimaryText}>Nova OS</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} activeOpacity={0.7} onPress={openEdit}>
          <MaterialIcons name="edit" size={18} color={palette.navy800} />
          <Text style={styles.btnOutlineText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <CrudDialog visible={dialogOpen} title="Editar cliente" fields={editFields} values={form} isSaving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setDialogOpen(false)} onSave={save} />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  // Profile card
  profileCard: { margin: spacing.lg, backgroundColor: palette.white, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', ...shadows.md },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  avatarText: { color: palette.white, fontWeight: '800', fontSize: 24 },
  nome: { fontSize: 20, fontWeight: '800', color: palette.slate900, marginBottom: 4 },
  cpf: { fontSize: 13, color: palette.slate400, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', width: '100%', backgroundColor: palette.slate50, borderRadius: borderRadius.md, padding: spacing.md },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: palette.slate200 },
  statNum: { fontSize: 18, fontWeight: '800', color: palette.navy800 },
  statLabel: { fontSize: 11, color: palette.slate400, marginTop: 2 },

  // Sections
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: palette.white, borderRadius: borderRadius.lg, padding: spacing.md, ...shadows.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: palette.slate100 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: palette.slate900 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm, gap: spacing.sm },
  infoIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: palette.navy50, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: palette.slate400, fontWeight: '600', marginBottom: 1 },
  infoValue: { fontSize: 14, color: palette.slate900, fontWeight: '500' },

  // Veículos
  veiculoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: palette.slate100 },
  veiculoIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: palette.navy50, justifyContent: 'center', alignItems: 'center' },
  veiculoNome: { fontSize: 14, fontWeight: '600', color: palette.slate900 },
  veiculoInfo: { fontSize: 12, color: palette.slate400, marginTop: 2 },

  // OS rows
  osRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  osRowBorder: { borderBottomWidth: 1, borderBottomColor: palette.slate100 },
  osNumBox: { backgroundColor: palette.navy50, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  osNum: { fontSize: 12, fontWeight: '700', color: palette.navy800 },
  osDesc: { fontSize: 13, fontWeight: '600', color: palette.slate900 },
  osData: { fontSize: 11, color: palette.slate400, marginTop: 2 },
  osStatus: { fontSize: 11, fontWeight: '700' },
  osValor: { fontSize: 13, fontWeight: '700', color: palette.slate700 },
  emptyText: { fontSize: 13, color: palette.slate400, fontStyle: 'italic' },

  // Actions
  actions: { marginHorizontal: spacing.lg, gap: spacing.sm },
  btnPrimary: { borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.sm },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14 },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: palette.white },
  btnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: palette.navy800, backgroundColor: palette.white },
  btnOutlineText: { fontSize: 15, fontWeight: '700', color: palette.navy800 },
});
