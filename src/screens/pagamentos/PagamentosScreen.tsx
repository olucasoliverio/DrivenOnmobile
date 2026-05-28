import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FAB, IconButton, Surface } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius } from '../../theme/theme';
import dayjs from 'dayjs';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'extrato' | 'pagar' | 'receber';

const fields: CrudField[] = [
  { key: 'tipo', label: 'Tipo (pagar ou receber)' },
  { key: 'valor', label: 'Valor', keyboardType: 'decimal-pad' },
  { key: 'data_vencimento', label: 'Vencimento (YYYY-MM-DD)' },
  { key: 'descricao', label: 'Descricao', multiline: true },
  { key: 'cliente_id', label: 'ID cliente (receber)', keyboardType: 'number-pad' },
  { key: 'ordem_servico_id', label: 'ID OS (opcional)', keyboardType: 'number-pad' },
  { key: 'metodo', label: 'Metodo (pix, dinheiro, cartao, boleto)' },
  { key: 'status', label: 'Status (pendente, pago)' },
];

export default function PagamentosScreen() {
  const insets = useSafeAreaInsets();
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

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'extrato', label: 'Extrato', icon: 'list-alt' },
    { key: 'pagar', label: 'A Pagar', icon: 'arrow-upward' },
    { key: 'receber', label: 'A Receber', icon: 'arrow-downward' },
  ];

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <MaterialIcons name={t.icon as any} size={16} color={tab === t.key ? colors.primary : '#9E9E9E'} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resumo */}
      <View style={styles.resumo}>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoLabel}>Saldo</Text>
          <Text style={[styles.resumoValue, { color: total >= 0 ? '#2E7D32' : '#D32F2F' }]}>
            R$ {Math.abs(total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.resumoSep} />
        <View style={styles.resumoItem}>
          <Text style={styles.resumoLabel}>Pendente</Text>
          <Text style={[styles.resumoValue, { color: '#E65100' }]}>R$ {pendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      <FlatList
        data={dados}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 160 }}
        renderItem={({ item: p }) => {
          const isReceber = p.tipo === 'receber';
          const isPago = p.status === 'pago';
          return (
            <TouchableOpacity onPress={() => openForm(p)} activeOpacity={0.8}>
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardRow}>
                <View style={[styles.iconBox, { backgroundColor: isReceber ? '#E8F5E9' : '#FFEBEE' }]}>
                  <MaterialIcons name={isReceber ? 'arrow-downward' : 'arrow-upward'} size={20} color={isReceber ? '#2E7D32' : '#D32F2F'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.desc}>{p.descricao}</Text>
                  <Text style={styles.data}>{dayjs(p.data).format('DD/MM/YYYY')}</Text>
                  {p.formaPagamento ? <Text style={styles.forma}>{p.formaPagamento}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.valor, { color: isReceber ? '#2E7D32' : '#D32F2F' }]}>
                    {isReceber ? '+' : '-'} R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: isPago ? '#E8F5E9' : '#FFF3E0' }]}>
                    <Text style={[styles.statusText, { color: isPago ? '#2E7D32' : '#E65100' }]}>
                      {isPago ? 'PAGO' : 'PENDENTE'}
                    </Text>
                  </View>
                </View>
                <IconButton icon="delete-outline" size={20} iconColor="#D32F2F" onPress={() => remove(p.id)} />
              </View>
            </Surface>
            </TouchableOpacity>
          );
        }}
      />
      <CrudDialog visible={dialogOpen} title={editingId ? 'Editar pagamento' : 'Novo pagamento'} fields={fields} values={form} isSaving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setDialogOpen(false)} onSave={save} />
      <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => openForm()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9E9E9E' },
  tabTextActive: { color: colors.primary },
  resumo: { flexDirection: 'row', backgroundColor: colors.primary, padding: spacing.lg },
  resumoItem: { flex: 1, alignItems: 'center' },
  resumoLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  resumoValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  resumoSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  desc: { fontSize: 14, fontWeight: '600', color: colors.onBackground },
  data: { fontSize: 12, color: '#757575', marginTop: 2 },
  forma: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  valor: { fontSize: 15, fontWeight: '800' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 96, right: 20, backgroundColor: colors.primary, borderRadius: 16, elevation: 8 },
});
