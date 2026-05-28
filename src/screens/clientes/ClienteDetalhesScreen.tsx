import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  em_andamento:    { label: 'Em Andamento', color: palette.navy800,    bg: 'rgba(37, 99, 235, 0.08)' },
  aguardando:      { label: 'Aguardando',   color: '#C2410C',          bg: '#FFF7ED' },
  aguardando_pecas:{ label: 'Aguard. Peças',color: palette.violet600,  bg: '#F5F3FF' },
  concluido:       { label: 'Concluído',    color: palette.emerald600, bg: '#ECFDF5' },
};

const AVATAR_COLORS = [
  [palette.navy800, palette.navy600],
  ['#8B5CF6', '#A78BFA'],
  ['#10B981', '#34D399'],
] as [string, string][];

const editFields: CrudField[] = [
  { key: 'nome', label: 'Nome', autoCapitalize: 'words' },
  { key: 'telefone', label: 'Telefone', keyboardType: 'phone-pad' },
  { key: 'email', label: 'E-mail', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'observacoes', label: 'Observações', multiline: true },
];

export default function ClienteDetalhesScreen() {
  const insets = useSafeAreaInsets();
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
        <Text style={styles.emptyText}>Cliente não encontrado.</Text>
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
      Alert.alert('Nome obrigatório', 'Informe o nome do cliente.');
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
      Alert.alert('Não foi possível salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate100 }}>
      <ScreenHeader title="Detalhes do Cliente" showBack={true} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }} 
        showsVerticalScrollIndicator={false}
      >
      {/* ── Perfil do cliente Redesenhado ── */}
      <View style={styles.profileCard}>
        <LinearGradient colors={avatarColors} style={styles.avatar}>
          <Text style={styles.avatarText}>{cliente.nome.substring(0, 2).toUpperCase()}</Text>
        </LinearGradient>
        <Text style={styles.nome}>{cliente.nome}</Text>
        <Text style={styles.cpf}>{cliente.cpf}</Text>

        {/* Estatísticas resumidas em cápsula elegante */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{veiculos.length}</Text>
            <Text style={styles.statLabel}>Veículos</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={styles.statNum}>{ordens.length}</Text>
            <Text style={styles.statLabel}>O.S.</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>R$ {(totalGasto / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Total Gasto</Text>
          </View>
        </View>
      </View>

      {/* ── Contatos com Caixas de Ícone Suaves ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="contacts" size={18} color={palette.navy800} />
          <Text style={styles.sectionTitle}>Contato</Text>
        </View>
        {[
          { icon: 'phone' as const,       label: 'Telefone',  value: cliente.telefone || 'Não informado' },
          { icon: 'email' as const,       label: 'E-mail',    value: cliente.email || 'Não informado' },
          { icon: 'location-on' as const, label: 'Endereço',  value: cliente.endereco ? `${cliente.endereco}, ${cliente.cidade}` : 'Não informado' },
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

      {/* ── Veículos Redesenhados ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="directions-car" size={18} color={palette.navy800} />
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

      {/* ── Histórico de Ordens de Serviço Redesenhado ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="build" size={18} color={palette.navy800} />
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
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[styles.statusBadge, { backgroundColor: st?.bg ?? palette.slate100 }]}>
                  <Text style={[styles.statusBadgeText, { color: st?.color ?? palette.slate500 }]}>{st?.label}</Text>
                </View>
                <Text style={styles.osValor}>R$ {os.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
          );
        })}
        {ordens.length === 0 && (
          <Text style={styles.emptyText}>Nenhuma ordem de serviço</Text>
        )}
      </View>

      {/* ── Botões de Ações Redesenhados ── */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.85} onPress={() => navigation.navigate('OS')}>
          <LinearGradient colors={gradients.navyPrimary} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <MaterialIcons name="build" size={18} color={palette.white} />
            <Text style={styles.btnPrimaryText}>Nova OS</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} activeOpacity={0.7} onPress={openEdit}>
          <MaterialIcons name="edit" size={18} color={palette.navy800} />
          <Text style={styles.btnOutlineText}>Editar Detalhes</Text>
        </TouchableOpacity>
      </View>

      <CrudDialog visible={dialogOpen} title="Editar cliente" fields={editFields} values={form} isSaving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setDialogOpen(false)} onSave={save} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  emptyText: { fontSize: 14, color: palette.slate400, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },

  // Profile card
  profileCard: { 
    margin: spacing.lg, 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.lg, 
    padding: spacing.lg, 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.md 
  },
  avatar: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  avatarText: { color: palette.white, fontWeight: '900', fontSize: 24 },
  nome: { fontSize: 22, fontWeight: '900', color: palette.slate900, marginBottom: 4, letterSpacing: -0.3 },
  cpf: { fontSize: 13, color: palette.slate400, fontWeight: '600', marginBottom: spacing.md },
  statsRow: { 
    flexDirection: 'row', 
    width: '100%', 
    backgroundColor: palette.slate50, 
    borderRadius: borderRadius.md, 
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.02)',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: palette.slate200 },
  statNum: { fontSize: 18, fontWeight: '900', color: palette.navy800 },
  statLabel: { fontSize: 11, color: palette.slate500, fontWeight: '700', marginTop: 2 },

  // Sections
  section: { 
    marginHorizontal: spacing.lg, 
    marginBottom: spacing.sm, 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.lg, 
    padding: spacing.md, 
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm, 
    marginBottom: spacing.md, 
    paddingBottom: spacing.sm, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(15, 23, 42, 0.04)' 
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: palette.slate900, letterSpacing: -0.2 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  infoIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(37, 99, 235, 0.05)', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: palette.slate400, fontWeight: '700', marginBottom: 1 },
  infoValue: { fontSize: 14, color: palette.slate900, fontWeight: '600' },

  // Veículos
  veiculoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(15, 23, 42, 0.04)' },
  veiculoIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(37, 99, 235, 0.05)', justifyContent: 'center', alignItems: 'center' },
  veiculoNome: { fontSize: 14, fontWeight: '700', color: palette.slate900 },
  veiculoInfo: { fontSize: 12, color: palette.slate500, fontWeight: '500', marginTop: 2 },

  // OS rows
  osRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  osRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(15, 23, 42, 0.04)' },
  osNumBox: { backgroundColor: 'rgba(37, 99, 235, 0.05)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  osNum: { fontSize: 11, fontWeight: '800', color: palette.navy800 },
  osDesc: { fontSize: 14, fontWeight: '700', color: palette.slate900 },
  osData: { fontSize: 11, color: palette.slate400, fontWeight: '500', marginTop: 2 },
  statusBadge: { borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  osValor: { fontSize: 13, fontWeight: '800', color: palette.slate700 },

  // Actions
  actions: { marginHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  btnPrimary: { borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.sm },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14 },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: palette.white },
  btnOutline: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: spacing.sm, 
    paddingVertical: 14, 
    borderRadius: borderRadius.md, 
    borderWidth: 1.5, 
    borderColor: palette.navy800, 
    backgroundColor: palette.white 
  },
  btnOutlineText: { fontSize: 15, fontWeight: '700', color: palette.navy800 },
});
