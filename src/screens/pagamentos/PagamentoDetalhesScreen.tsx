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
  { key: 'tipo', label: 'Tipo (pagar ou receber)', autoCapitalize: 'none' },
  { key: 'valor', label: 'Valor', keyboardType: 'decimal-pad' },
  { key: 'data_vencimento', label: 'Vencimento (YYYY-MM-DD)', keyboardType: 'default' },
  { key: 'descricao', label: 'Descrição', multiline: true },
  { key: 'cliente_id', label: 'Cliente (opcional)', keyboardType: 'number-pad' },
  { key: 'ordem_servico_id', label: 'Ordem de Serviço (opcional)', keyboardType: 'number-pad' },
  { key: 'metodo', label: 'Método (pix, dinheiro, cartao, boleto)', autoCapitalize: 'none' },
  { key: 'status', label: 'Status (pendente, pago)', autoCapitalize: 'none' },
];

export default function PagamentoDetalhesScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { pagamentoId } = route.params ?? { pagamentoId: 1 };
  const { pagamentos, clientes, ordens, updateRecord, deleteRecord } = useDriveOnData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const p = pagamentos.find(item => item.id === pagamentoId);
  const cliente = p?.clienteId ? clientes.find(c => c.id === p.clienteId) : undefined;
  const os = p?.ordemId ? ordens.find(o => o.id === p.ordemId) : undefined;

  if (!p) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Lançamento não encontrado" showBack={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>O lançamento financeiro solicitado não foi localizado.</Text>
        </View>
      </View>
    );
  }

  const isReceber = p.tipo === 'receber';
  const isPago = p.status === 'pago';

  const openEditForm = () => {
    setForm({
      tipo: p.tipo,
      valor: String(p.valor),
      data_vencimento: dayjs(p.data).format('YYYY-MM-DD'),
      descricao: p.descricao,
      cliente_id: p.clienteId ? String(p.clienteId) : '',
      ordem_servico_id: p.ordemId ? String(p.ordemId) : '',
      metodo: p.formaPagamento || 'pix',
      status: p.status || 'pendente',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.tipo || !form.valor || !form.data_vencimento) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha tipo, valor e vencimento.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tipo: form.tipo.trim(),
        valor: Number(String(form.valor).replace(',', '.')),
        data_vencimento: form.data_vencimento,
        descricao: form.descricao?.trim() || null,
        cliente_id: form.cliente_id ? Number(form.cliente_id) : null,
        ordem_servico_id: form.ordem_servico_id ? Number(form.ordem_servico_id) : null,
        metodo: form.metodo?.trim() || 'pix',
        status: form.status?.trim() || 'pendente',
      };
      await updateRecord('/pagamentos', p.id, payload);
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Não foi possível salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const marcarComoPago = async () => {
    setSaving(true);
    try {
      const payload = {
        tipo: p.tipo,
        valor: p.valor,
        data_vencimento: dayjs(p.data).format('YYYY-MM-DD'),
        descricao: p.descricao || null,
        cliente_id: p.clienteId,
        ordem_servico_id: p.ordemId,
        metodo: p.formaPagamento || 'pix',
        status: 'pago',
      };
      await updateRecord('/pagamentos', p.id, payload);
    } catch (error: any) {
      Alert.alert('Não foi possível atualizar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const removePagamento = () => {
    Alert.alert('Excluir Lançamento?', 'Deseja excluir permanentemente este registro financeiro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord('/pagamentos', p.id);
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Erro ao excluir', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Lançamento"
        subtitle={isReceber ? 'Conta a Receber' : 'Conta a Pagar'}
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
        {/* Card Principal de Valores */}
        <View style={[styles.mainCard, { borderLeftColor: isReceber ? palette.emerald600 : palette.rose600 }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.cardTitle}>{p.descricao || (isReceber ? 'Recebimento' : 'Pagamento')}</Text>
              <Text style={[styles.cardTotal, { color: isReceber ? palette.emerald600 : palette.rose600 }]}>
                {isReceber ? '+' : '-'} R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isPago ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)' }]}>
              <View style={[styles.statusDot, { backgroundColor: isPago ? palette.emerald600 : palette.amber500 }]} />
              <Text style={[styles.statusText, { color: isPago ? palette.emerald600 : palette.amber500 }]}>
                {isPago ? 'PAGO' : 'PENDENTE'}
              </Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.datesRow}>
            <View>
              <Text style={styles.metaLabel}>Vencimento / Data</Text>
              <Text style={styles.metaValue}>{dayjs(p.data).format('DD/MM/YYYY')}</Text>
            </View>
            {p.formaPagamento ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>Forma de Pagamento</Text>
                <Text style={[styles.metaValue, { textTransform: 'uppercase' }]}>{p.formaPagamento}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Ficha Clientes / OS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vínculos</Text>
          
          {cliente ? (
            <TouchableOpacity
              style={styles.associationCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ClienteDetalhes', { clienteId: cliente.id })}
            >
              <View style={styles.associationIconBox}>
                <MaterialIcons name="person" size={20} color={palette.navy800} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.associationLabel}>Cliente</Text>
                <Text style={styles.associationValue}>{cliente.nome}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyLinkBox}>
              <Text style={styles.emptyLinkLabel}>Sem cliente associado</Text>
            </View>
          )}

          {os ? (
            <TouchableOpacity
              style={[styles.associationCard, { marginTop: spacing.sm }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('OSDetalhes', { osId: os.id })}
            >
              <View style={styles.associationIconBox}>
                <MaterialIcons name="engineering" size={20} color={palette.navy800} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.associationLabel}>Ordem de Serviço</Text>
                <Text style={styles.associationValue}>OS #{String(os.id).padStart(3, '0')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.emptyLinkBox, { marginTop: spacing.sm }]}>
              <Text style={styles.emptyLinkLabel}>Sem Ordem de Serviço vinculada</Text>
            </View>
          )}
        </View>

        {/* Ação Primária: Marcar como Pago */}
        {!isPago && (
          <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.7} onPress={marcarComoPago}>
            <MaterialIcons name="check-circle" size={20} color={palette.white} />
            <Text style={styles.confirmBtnText}>Marcar como Recebido/Pago</Text>
          </TouchableOpacity>
        )}

        {/* Botão de Excluir */}
        <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.7} onPress={removePagamento}>
          <MaterialIcons name="delete" size={20} color={palette.rose600} />
          <Text style={styles.deleteBtnText}>Excluir Lançamento</Text>
        </TouchableOpacity>
      </ScrollView>

      <CrudDialog
        visible={dialogOpen}
        title="Editar Lançamento"
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
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    borderLeftWidth: 4,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleColumn: { gap: 4, flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: palette.slate900, letterSpacing: -0.1 },
  cardTotal: { fontSize: 24, fontWeight: '900', marginTop: 2, letterSpacing: -0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4, gap: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 9, fontWeight: '800' },
  cardDivider: { height: 1, backgroundColor: palette.slate100, marginVertical: spacing.md },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontSize: 10, color: palette.slate400, fontWeight: '600' },
  metaValue: { fontSize: 13, color: palette.slate900, fontWeight: '700', marginTop: 1 },

  // Seções
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: palette.slate500, textTransform: 'uppercase', marginBottom: spacing.sm, letterSpacing: 0.3 },

  // Cartões de Associação
  associationCard: {
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
  associationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.navy50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  associationLabel: { fontSize: 10, color: palette.slate400, fontWeight: '600' },
  associationValue: { fontSize: 13, color: palette.slate900, fontWeight: '700', marginTop: 1 },
  
  // Empty Links
  emptyLinkBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.02)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.slate200,
  },
  emptyLinkLabel: { fontSize: 12, color: palette.slate400, fontWeight: '600' },

  // Botões
  confirmBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.navy800,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  confirmBtnText: { fontSize: 14, color: palette.white, fontWeight: '700' },
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
    ...shadows.sm,
  },
  deleteBtnText: { fontSize: 14, color: palette.rose600, fontWeight: '700' },
});
