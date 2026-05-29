import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius, palette, shadows, gradients } from '../../theme/theme';
import dayjs from 'dayjs';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { LinearGradient } from 'expo-linear-gradient';

type Tab = 'extrato' | 'pagar' | 'receber';

const fields: CrudField[] = [
  { key: 'tipo', label: 'Tipo (pagar ou receber)' },
  { key: 'valor', label: 'Valor', keyboardType: 'decimal-pad' },
  { key: 'data_vencimento', label: 'Vencimento (YYYY-MM-DD)' },
  { key: 'descricao', label: 'Descricao', multiline: true },
  { key: 'cliente_id', label: 'Cliente', keyboardType: 'number-pad' },
  { key: 'ordem_servico_id', label: 'Ordem de Serviço (opcional)', keyboardType: 'number-pad' },
  { key: 'metodo', label: 'Metodo (pix, dinheiro, cartao, boleto)' },
  { key: 'status', label: 'Status (pendente, pago)' },
];

export default function PagamentosScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { pagamentos, createRecord, updateRecord, deleteRecord } = useDriveOnData();
  const [tab, setTab] = useState<Tab>('extrato');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const dados = tab === 'extrato'
    ? pagamentos
    : pagamentos.filter(p => p.tipo === (tab === 'pagar' ? 'pagar' : 'receber'));

  const total = dados.reduce((acc, p) => acc + (p.tipo === 'receber' ? p.valor : -p.valor), 0);
  const pendentes = dados.filter(p => p.status === 'pendente').reduce((acc, p) => acc + p.valor, 0);

  const openForm = (item?: (typeof pagamentos)[number]) => {
    setEditingId(item?.id ?? null);
    setForm(item ? {
      tipo: item.tipo,
      valor: String(item.valor),
      data_vencimento: dayjs(item.data).format('YYYY-MM-DD'),
      descricao: item.descricao,
      cliente_id: item.clienteId ? String(item.clienteId) : '',
      ordem_servico_id: item.ordemId ? String(item.ordemId) : '',
      metodo: item.formaPagamento || 'pix',
      status: item.status || 'pendente',
    } : {
      tipo: tab === 'pagar' ? 'pagar' : 'receber',
      data_vencimento: dayjs().format('YYYY-MM-DD'),
      metodo: 'pix',
      status: 'pendente',
      cliente_id: '',
      ordem_servico_id: '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.tipo || !form.valor || !form.data_vencimento) {
      Alert.alert('Campos obrigatorios', 'Informe tipo, valor e vencimento.');
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
      if (editingId) await updateRecord('/pagamentos', editingId, payload);
      else await createRecord('/pagamentos', payload);
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Nao foi possivel salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    Alert.alert('Remover pagamento?', 'Essa acao cancela o registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/pagamentos', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'extrato', label: 'Todos' },
    { key: 'pagar', label: 'A Pagar' },
    { key: 'receber', label: 'A Receber' },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Financeiro" showBack={true} />

      {/* Resumo */}
      <View style={styles.resumoContainer}>
        <View style={styles.resumoCard}>
          <View style={[styles.resumoIconBox, { backgroundColor: total >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)' }]}>
            <MaterialIcons name="account-balance-wallet" size={18} color={total >= 0 ? palette.emerald600 : palette.rose600} />
          </View>
          <View style={styles.resumoTexts}>
            <Text style={styles.resumoLabel}>Saldo Geral</Text>
            <Text style={[styles.resumoValue, { color: total >= 0 ? palette.emerald600 : palette.rose600 }]}>
              {total >= 0 ? '' : '-'}R$ {Math.abs(total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.resumoCard}>
          <View style={[styles.resumoIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}>
            <MaterialIcons name="hourglass-empty" size={18} color={palette.amber500} />
          </View>
          <View style={styles.resumoTexts}>
            <Text style={styles.resumoLabel}>Total Pendente</Text>
            <Text style={[styles.resumoValue, { color: palette.amber500 }]}>
              R$ {pendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.chipsContainer}>
        <FlatList
          horizontal
          data={tabs}
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          renderItem={({ item }) => {
            const isActive = tab === item.key;
            return (
              <TouchableOpacity
                onPress={() => setTab(item.key)}
                activeOpacity={0.7}
              >
                {isActive ? (
                  <LinearGradient colors={gradients.navyPrimary} style={styles.chipActive}>
                    <Text style={styles.chipTextActive}>{item.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{item.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={dados}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        style={styles.mainList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <EmptyState
            icon="payment"
            message={
              tab === 'extrato'
                ? 'Nenhum lançamento no extrato'
                : tab === 'pagar'
                ? 'Nenhuma conta a pagar'
                : 'Nenhuma conta a receber'
            }
            isFullPage
          />
        )}
        renderItem={({ item: p }) => {
          const isReceber = p.tipo === 'receber';
          const isPago = p.status === 'pago';
          return (
            <TouchableOpacity onPress={() => navigation.navigate('PagamentoDetalhes', { pagamentoId: p.id })} activeOpacity={0.8}>
              <View style={[styles.card, { borderLeftColor: isReceber ? palette.emerald600 : palette.rose600 }]}>
                <View style={styles.cardRow}>
                  {/* Icon Box */}
                  <View style={[styles.iconBox, { backgroundColor: isReceber ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)' }]}>
                    <MaterialIcons 
                      name={isReceber ? 'arrow-downward' : 'arrow-upward'} 
                      size={20} 
                      color={isReceber ? palette.emerald600 : palette.rose600} 
                    />
                  </View>

                  {/* Details */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.desc} numberOfLines={1}>
                      {p.descricao || (isReceber ? 'Recebimento' : 'Pagamento')}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <MaterialIcons name="event" size={12} color={palette.slate400} />
                        <Text style={styles.metaText}>{dayjs(p.data).format('DD/MM/YYYY')}</Text>
                      </View>
                      {p.formaPagamento ? (
                        <View style={styles.metaItem}>
                          <MaterialIcons name="credit-card" size={12} color={palette.slate400} />
                          <Text style={styles.metaText}>{p.formaPagamento.toUpperCase()}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Value and Status */}
                  <View style={{ alignItems: 'flex-end', marginRight: spacing.xs }}>
                    <Text style={[styles.valorText, { color: isReceber ? palette.emerald600 : palette.rose600 }]}>
                      {isReceber ? '+' : '-'} R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: isPago ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)' }]}>
                      <View style={[styles.statusDot, { backgroundColor: isPago ? palette.emerald600 : palette.amber500 }]} />
                      <Text style={[styles.statusText, { color: isPago ? palette.emerald600 : palette.amber500 }]}>
                        {isPago ? 'PAGO' : 'PENDENTE'}
                      </Text>
                    </View>
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity 
                    style={styles.deleteBtn}
                    onPress={() => remove(p.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="delete-outline" size={20} color={palette.slate400} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <CrudDialog visible={dialogOpen} title={editingId ? 'Editar pagamento' : 'Novo pagamento'} fields={fields} values={form} isSaving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setDialogOpen(false)} onSave={save} />
      <FAB icon="plus" style={styles.fab} color={palette.white} onPress={() => openForm()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },
  
  // Resumo Metric Cards
  resumoContainer: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.md },
  resumoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    gap: spacing.sm,
    ...shadows.sm,
  },
  resumoIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  resumoTexts: { flex: 1 },
  resumoLabel: { fontSize: 10, color: palette.slate400, fontWeight: '700' },
  resumoValue: { fontSize: 14, fontWeight: '900', marginTop: 1, letterSpacing: -0.2 },

  // Chips
  chipsContainer: { marginTop: spacing.sm, flexGrow: 0 },
  chipsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.slate200 },
  chipActive: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full },
  chipText: { fontSize: 12, fontWeight: '600', color: palette.slate500 },
  chipTextActive: { fontSize: 12, fontWeight: '700', color: palette.white },

  // List
  mainList: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: 100, gap: spacing.sm },

  // Card list item
  card: { 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.md, 
    borderWidth: 1, 
    borderColor: 'rgba(15, 23, 42, 0.04)', 
    borderLeftWidth: 4, 
    overflow: 'hidden', 
    ...shadows.sm 
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  desc: { fontSize: 14, fontWeight: '700', color: palette.slate900, letterSpacing: -0.1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: palette.slate400, fontWeight: '600' },
  valorText: { fontSize: 14, fontWeight: '900', letterSpacing: -0.2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 3, gap: 4, marginTop: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 9, fontWeight: '800' },
  deleteBtn: { padding: 4, justifyContent: 'center', alignItems: 'center' },
  fab: { 
    position: 'absolute', 
    bottom: 24, 
    right: 20, 
    backgroundColor: palette.navy800, 
    borderRadius: borderRadius.lg, 
    ...shadows.lg 
  },
});
