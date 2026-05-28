import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput as RNTextInput, TouchableOpacity, View } from 'react-native';
import { FAB, IconButton, Surface } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { borderRadius, colors, spacing } from '../../theme/theme';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';

const fields: CrudField[] = [
  { key: 'nome', label: 'Nome', autoCapitalize: 'words' },
  { key: 'descricao', label: 'Descricao', multiline: true },
  { key: 'preco_custo', label: 'Preco de custo', keyboardType: 'decimal-pad' },
  { key: 'preco_venda', label: 'Preco de venda', keyboardType: 'decimal-pad' },
  { key: 'estoque_qtd', label: 'Quantidade', keyboardType: 'number-pad' },
];

export default function EstoqueScreen() {
  const insets = useSafeAreaInsets();
  const { estoque, createRecord, updateRecord, deleteRecord } = useDriveOnData();
  const [busca, setBusca] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const itens = estoque.filter(e => e.nome.toLowerCase().includes(busca.toLowerCase()) || e.categoria.toLowerCase().includes(busca.toLowerCase()));
  const baixoEstoque = itens.filter(e => e.quantidade <= e.estoqueMinimo);

  const openForm = (item?: (typeof estoque)[number]) => {
    setEditingId(item?.id ?? null);
    setForm(item ? {
      nome: item.nome,
      descricao: item.categoria === 'Geral' ? '' : item.categoria,
      preco_custo: String(item.valorUnitario),
      preco_venda: String(item.valorUnitario),
      estoque_qtd: String(item.quantidade),
    } : {});
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.nome?.trim()) {
      Alert.alert('Nome obrigatorio', 'Informe o nome do item.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao?.trim() || '',
        preco_custo: Number(String(form.preco_custo || '0').replace(',', '.')),
        preco_venda: Number(String(form.preco_venda || '0').replace(',', '.')),
        estoque_qtd: Number(form.estoque_qtd || 0),
      };
      if (editingId) await updateRecord('/estoque', editingId, payload);
      else await createRecord('/estoque', payload);
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Nao foi possivel salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    Alert.alert('Remover item?', 'Essa acao desativa o registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/estoque', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      {baixoEstoque.length > 0 && (
        <View style={styles.alertaBanner}>
          <MaterialIcons name="warning" size={18} color="#E65100" />
          <Text style={styles.alertaText}>{baixoEstoque.length} item(ns) com estoque baixo</Text>
        </View>
      )}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#9E9E9E" style={{ marginRight: spacing.sm }} />
        <RNTextInput placeholder="Buscar item ou categoria..." value={busca} onChangeText={setBusca} style={styles.searchInput} placeholderTextColor="#BDBDBD" />
      </View>
      <FlatList
        data={itens}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 160, flexGrow: 1 }}
        ListEmptyComponent={() => (
          <EmptyState
            icon="inventory"
            message={busca.length > 0 ? 'Nenhum item encontrado para esta busca' : 'Nenhum item em estoque'}
            isFullPage
          />
        )}
        renderItem={({ item: e }) => {
          const isBaixo = e.quantidade <= e.estoqueMinimo;
          const isSemEstoque = e.quantidade === 0;
          return (
            <TouchableOpacity onPress={() => openForm(e)} activeOpacity={0.8}>
              <Surface style={styles.card} elevation={1}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconBox, { backgroundColor: isSemEstoque ? '#FFEBEE' : isBaixo ? '#FFF3E0' : '#E8F5E9' }]}>
                    <MaterialIcons name="inventory-2" size={24} color={isSemEstoque ? '#D32F2F' : isBaixo ? '#E65100' : '#2E7D32'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome}>{e.nome}</Text>
                    <View style={styles.categoriaRow}>
                      <View style={styles.categoriaBadge}><Text style={styles.categoriaText}>{e.categoria}</Text></View>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.qtd, { color: isSemEstoque ? '#D32F2F' : isBaixo ? '#E65100' : '#2E7D32' }]}>
                      {e.quantidade} {e.unidade}
                    </Text>
                    <Text style={styles.valorUnit}>R$ {e.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                    {isBaixo && <Text style={styles.minimoText}>Min: {e.estoqueMinimo}</Text>}
                  </View>
                  <IconButton icon="delete-outline" size={20} iconColor="#D32F2F" onPress={() => remove(e.id)} />
                </View>
              </Surface>
            </TouchableOpacity>
          );
        }}
      />
      <CrudDialog visible={dialogOpen} title={editingId ? 'Editar item' : 'Novo item'} fields={fields} values={form} isSaving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setDialogOpen(false)} onSave={save} />
      <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => openForm()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  alertaBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#FFF3E0', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#FFE0B2' },
  alertaText: { fontSize: 13, color: '#E65100', fontWeight: '600' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: colors.onBackground },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  nome: { fontSize: 14, fontWeight: '700', color: colors.onBackground },
  categoriaRow: { marginTop: 4 },
  categoriaBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  categoriaText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
  qtd: { fontSize: 18, fontWeight: '800' },
  valorUnit: { fontSize: 12, color: '#757575', marginTop: 2 },
  minimoText: { fontSize: 10, color: '#E65100', marginTop: 2 },
  fab: { position: 'absolute', bottom: 96, right: 20, backgroundColor: colors.primary, borderRadius: 16, elevation: 8 },
});
