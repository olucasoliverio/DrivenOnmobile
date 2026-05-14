import React from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Surface, FAB, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius } from '../../theme/theme';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';

const categoriaCores: Record<string, string> = {
  'Revisão': '#1565C0',
  'Rodagem': '#0097A7',
  'Freios': '#D32F2F',
  'Diagnóstico': '#6A1B9A',
  'Motor': '#E65100',
  'Suspensão': '#37474F',
};

const fields: CrudField[] = [
  { key: 'nome', label: 'Nome', autoCapitalize: 'words' },
  { key: 'descricao', label: 'Descricao', multiline: true },
  { key: 'preco', label: 'Preco', keyboardType: 'decimal-pad' },
  { key: 'categoria', label: 'Categoria', autoCapitalize: 'words' },
];

export default function ServicosScreen() {
  const { servicos, createRecord, updateRecord, deleteRecord } = useDriveOnData();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string>>({});

  const openForm = (item?: (typeof servicos)[number]) => {
    setEditingId(item?.id ?? null);
    setForm(item ? {
      nome: item.nome,
      descricao: item.descricao,
      preco: String(item.valor),
      categoria: item.categoria,
    } : {});
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.nome?.trim() || !form.preco?.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe nome e preco.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao?.trim() || null,
        preco: Number(String(form.preco).replace(',', '.')) || 0,
        categoria: form.categoria?.trim() || undefined,
      };
      if (editingId) await updateRecord('/servicos', editingId, payload);
      else await createRecord('/servicos', payload);
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Nao foi possivel salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    Alert.alert('Remover servico?', 'Essa acao desativa o registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/servicos', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={servicos}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 80 }}
        renderItem={({ item: s }) => {
          const cor = categoriaCores[s.categoria] ?? colors.primary;
          return (
            <TouchableOpacity onPress={() => openForm(s)} activeOpacity={0.8}>
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardRow}>
                <View style={[styles.colorBar, { backgroundColor: cor }]} />
                <View style={{ flex: 1, paddingLeft: spacing.sm }}>
                  <View style={styles.header}>
                    <Text style={styles.nome}>{s.nome}</Text>
                    <IconButton icon="delete-outline" size={18} iconColor="#D32F2F" onPress={() => remove(s.id)} />
                    <Text style={styles.valor}>R$ {s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                  </View>
                  <Text style={styles.descricao} numberOfLines={2}>{s.descricao}</Text>
                  <View style={styles.footer}>
                    <View style={[styles.badge, { backgroundColor: cor + '15' }]}>
                      <Text style={[styles.badgeText, { color: cor }]}>{s.categoria}</Text>
                    </View>
                    <View style={styles.tempoRow}>
                      <MaterialIcons name="schedule" size={13} color="#9E9E9E" />
                      <Text style={styles.tempo}>{s.tempoEstimado}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Surface>
            </TouchableOpacity>
          );
        }}
      />
      <CrudDialog visible={dialogOpen} title={editingId ? 'Editar servico' : 'Novo servico'} fields={fields} values={form} isSaving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setDialogOpen(false)} onSave={save} />
      <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => openForm()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { borderRadius: borderRadius.md, backgroundColor: '#FFF', overflow: 'hidden', flexDirection: 'row' },
  cardRow: { flexDirection: 'row', flex: 1 },
  colorBar: { width: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingTop: spacing.md, paddingRight: spacing.md },
  nome: { fontSize: 14, fontWeight: '700', color: colors.onBackground, flex: 1 },
  valor: { fontSize: 16, fontWeight: '800', color: colors.primary },
  descricao: { fontSize: 12, color: '#757575', paddingRight: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md, paddingRight: spacing.md },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  tempoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tempo: { fontSize: 12, color: '#9E9E9E' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
});
