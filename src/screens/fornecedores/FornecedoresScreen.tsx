import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TextInput as RNTextInput, TouchableOpacity } from 'react-native';
import { Surface, FAB, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius } from '../../theme/theme';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const fields: CrudField[] = [
  { key: 'nome', label: 'Nome', autoCapitalize: 'words' },
  { key: 'telefone', label: 'Telefone', keyboardType: 'phone-pad' },
  { key: 'email', label: 'E-mail', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'contato', label: 'Contato', autoCapitalize: 'words' },
];

export default function FornecedoresScreen() {
  const insets = useSafeAreaInsets();
  const { fornecedores: fornecedoresData, createRecord, updateRecord, deleteRecord } = useDriveOnData();
  const [busca, setBusca] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const fornecedores = fornecedoresData.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) || f.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  const openForm = (item?: (typeof fornecedoresData)[number]) => {
    setEditingId(item?.id ?? null);
    setForm(item ? {
      nome: item.nome,
      telefone: item.telefone,
      email: item.email,
      contato: item.categoria === 'Geral' ? '' : item.categoria,
    } : {});
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.nome?.trim()) {
      Alert.alert('Nome obrigatorio', 'Informe o nome do fornecedor.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        telefone: form.telefone?.trim() || null,
        email: form.email?.trim() || null,
        contato: form.contato?.trim() || null,
      };
      if (editingId) await updateRecord('/fornecedores', editingId, payload);
      else await createRecord('/fornecedores', payload);
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Nao foi possivel salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    Alert.alert('Remover fornecedor?', 'Essa acao desativa o registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/fornecedores', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#9E9E9E" style={{ marginRight: spacing.sm }} />
        <RNTextInput placeholder="Buscar fornecedor..." value={busca} onChangeText={setBusca} style={styles.searchInput} placeholderTextColor="#BDBDBD" />
      </View>
      <FlatList
        data={fornecedores}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 160 }}
        renderItem={({ item: f }) => (
          <TouchableOpacity onPress={() => openForm(f)} activeOpacity={0.8}>
          <Surface style={styles.card} elevation={1}>
            <View style={styles.cardRow}>
              <View style={styles.iconBox}><MaterialIcons name="local-shipping" size={24} color={colors.secondary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome}>{f.nome}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{f.categoria}</Text></View>
                <View style={styles.infoRow}><MaterialIcons name="phone" size={13} color="#9E9E9E" /><Text style={styles.infoText}>{f.telefone}</Text></View>
                <View style={styles.infoRow}><MaterialIcons name="email" size={13} color="#9E9E9E" /><Text style={styles.infoText}>{f.email}</Text></View>
                <View style={styles.infoRow}><MaterialIcons name="location-city" size={13} color="#9E9E9E" /><Text style={styles.infoText}>{f.cidade}</Text></View>
              </View>
              <IconButton icon="delete-outline" size={20} iconColor="#D32F2F" onPress={() => remove(f.id)} />
            </View>
          </Surface>
          </TouchableOpacity>
        )}
      />
      <CrudDialog
        visible={dialogOpen}
        title={editingId ? 'Editar fornecedor' : 'Novo fornecedor'}
        fields={fields}
        values={form}
        isSaving={saving}
        onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))}
        onCancel={() => setDialogOpen(false)}
        onSave={save}
      />
      <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => openForm()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: colors.onBackground },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardRow: { flexDirection: 'row', gap: spacing.md },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
  nome: { fontSize: 14, fontWeight: '700', color: colors.onBackground, marginBottom: 4 },
  badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginBottom: spacing.sm },
  badgeText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  infoText: { fontSize: 12, color: '#757575' },
  fab: { position: 'absolute', bottom: 96, right: 20, backgroundColor: colors.primary, borderRadius: 16, elevation: 8 },
});
