import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import dayjs from 'dayjs';

const editFields: CrudField[] = [
  { key: 'marca', label: 'Marca', autoCapitalize: 'words' },
  { key: 'modelo', label: 'Modelo', autoCapitalize: 'words' },
  { key: 'ano', label: 'Ano', keyboardType: 'number-pad' },
  { key: 'placa', label: 'Placa', autoCapitalize: 'characters' },
  { key: 'cor', label: 'Cor', autoCapitalize: 'words' },
  { key: 'km', label: 'Quilometragem (KM)', keyboardType: 'number-pad' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  em_andamento:    { label: 'Em Andamento', color: palette.navy800,    bg: 'rgba(37, 99, 235, 0.08)' },
  aguardando:      { label: 'Aguardando',   color: '#C2410C',          bg: '#FFF7ED' },
  aguardando_pecas:{ label: 'Aguard. Peças',color: palette.violet600,  bg: '#F5F3FF' },
  concluido:       { label: 'Concluído',    color: palette.emerald600, bg: '#ECFDF5' },
};

export default function VeiculoDetalhesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { veiculoId } = route.params ?? { veiculoId: 1 };
  const { veiculos, clientes, ordens: ordensData, updateRecord, deleteRecord } = useDriveOnData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const veiculo = veiculos.find(v => v.id === veiculoId);
  const cliente = veiculo ? clientes.find(c => c.id === veiculo.clienteId) : undefined;
  const ordens = veiculo ? ordensData.filter(o => o.veiculoId === veiculo.id) : [];

  if (!veiculo) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Veículo não encontrado" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>O veículo solicitado não foi localizado.</Text>
        </View>
      </View>
    );
  }

  const openEditForm = () => {
    setForm({
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: String(veiculo.ano),
      placa: veiculo.placa,
      cor: veiculo.cor,
      km: String(veiculo.km),
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.marca?.trim() || !form.modelo?.trim() || !form.placa?.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, informe a marca, o modelo e a placa.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        ano: Number(form.ano || veiculo.ano),
        placa: form.placa.trim().toUpperCase(),
        cor: form.cor.trim(),
        km: Number(form.km || veiculo.km),
        cliente_id: veiculo.clienteId,
      };
      await updateRecord('/veiculos', veiculo.id, payload);
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Não foi possível salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const removeVeiculo = () => {
    Alert.alert('Excluir Veículo?', 'Esta ação não poderá ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord('/veiculos', veiculo.id);
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Não foi possível excluir', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`${veiculo.marca} ${veiculo.modelo}`}
        subtitle="Detalhes do Veículo"
        showBack={true}
        rightElement={
          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={openEditForm}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={22} color={palette.slate700} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card Principal */}
        <View style={styles.mainCard}>
          <View style={styles.carIconBox}>
            <MaterialIcons name="directions-car" size={32} color={palette.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mainTitle}>{veiculo.marca} {veiculo.modelo}</Text>
            <Text style={styles.mainSubtitle}>Ano {veiculo.ano}</Text>
          </View>
          <View style={styles.placaBadge}>
            <Text style={styles.placaText}>{veiculo.placa}</Text>
          </View>
        </View>

        {/* Ficha Técnica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ficha Técnica</Text>
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cor</Text>
              <Text style={styles.detailValue}>{veiculo.cor}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quilometragem</Text>
              <Text style={styles.detailValue}>{veiculo.km.toLocaleString('pt-BR')} km</Text>
            </View>
          </View>
        </View>

        {/* Proprietário */}
        {cliente && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proprietário</Text>
            <TouchableOpacity
              style={styles.ownerCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ClienteDetalhes', { clienteId: cliente.id })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{cliente.nome.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>{cliente.nome}</Text>
                <Text style={styles.ownerPhone}>{cliente.telefone}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
            </TouchableOpacity>
          </View>
        )}

        {/* Histórico de Ordens de Serviço */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Ordens de Serviço ({ordens.length})</Text>
          {ordens.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialIcons name="engineering" size={24} color={palette.slate300} />
              <Text style={styles.emptyText}>Nenhuma OS registrada para este veículo.</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {ordens.map((os, idx) => {
                const st = STATUS_MAP[os.status] ?? { label: os.status, color: palette.slate500, bg: palette.slate100 };
                return (
                  <TouchableOpacity
                    key={os.id}
                    style={[
                      styles.osItem,
                      idx === 0 && styles.osItemFirst,
                      idx === ordens.length - 1 && styles.osItemLast,
                      idx < ordens.length - 1 && styles.osItemBorder
                    ]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('OSDetalhes', { osId: os.id })}
                  >
                    <View style={styles.osLeft}>
                      <Text style={styles.osNum}>OS #{String(os.id).padStart(3, '0')}</Text>
                      <Text style={styles.osDate}>{dayjs(os.dataEntrada).format('DD/MM/YYYY')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                      <View style={[styles.osBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.osBadgeText, { color: st.color }]}>{st.label}</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={18} color={palette.slate400} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Botão de Excluir */}
        <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.7} onPress={removeVeiculo}>
          <MaterialIcons name="delete" size={20} color={palette.rose600} />
          <Text style={styles.deleteBtnText}>Excluir Veículo</Text>
        </TouchableOpacity>
      </ScrollView>

      <CrudDialog
        visible={dialogOpen}
        title="Editar Veículo"
        fields={editFields}
        values={form}
        isSaving={saving}
        onChange={(key, value) => setForm((curr) => ({ ...curr, [key]: value }))}
        onCancel={() => setDialogOpen(false)}
        onSave={save}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorText: { fontSize: 14, color: palette.slate500, fontWeight: '500' },
  headerEditBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },

  // Card Principal
  mainCard: {
    backgroundColor: palette.navy800,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  carIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: { fontSize: 18, fontWeight: '800', color: palette.white, letterSpacing: -0.3 },
  mainSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.75)', marginTop: 2, fontWeight: '600' },
  placaBadge: {
    backgroundColor: palette.white,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.slate300,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  placaText: { fontSize: 12, fontWeight: '800', color: palette.slate900, letterSpacing: 0.5 },

  // Seções
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: palette.slate500, textTransform: 'uppercase', marginBottom: spacing.sm, letterSpacing: 0.3 },

  // Ficha técnica details box
  detailsBox: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: palette.slate400, fontWeight: '600' },
  detailValue: { fontSize: 14, color: palette.slate900, fontWeight: '700' },
  detailDivider: { height: 1, backgroundColor: palette.slate100, marginVertical: spacing.sm },

  // Proprietário card
  ownerCard: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.navy50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: palette.navy800, fontWeight: '700', fontSize: 14 },
  ownerName: { fontSize: 14, fontWeight: '700', color: palette.slate900 },
  ownerPhone: { fontSize: 12, color: palette.slate400, marginTop: 1, fontWeight: '500' },

  // Histórico list
  emptyBox: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
  },
  emptyText: { fontSize: 12, color: palette.slate400, fontWeight: '500' },
  historyList: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
    overflow: 'hidden',
  },
  osItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: palette.white,
  },
  osItemFirst: {
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  osItemLast: {
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  osItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF2',
  },
  osLeft: { gap: 2 },
  osNum: { fontSize: 14, fontWeight: '700', color: palette.slate900 },
  osDate: { fontSize: 11, color: palette.slate400, fontWeight: '500' },
  osBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  osBadgeText: { fontSize: 10, fontWeight: '700' },

  // Botão excluir
  deleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: palette.rose100,
    paddingVertical: 14,
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  deleteBtnText: { fontSize: 14, color: palette.rose600, fontWeight: '700' },
});
