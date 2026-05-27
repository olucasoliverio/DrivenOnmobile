import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TextInput as RNTextInput, TouchableOpacity } from 'react-native';
import { Surface, FAB, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius } from '../../theme/theme';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';

const fields: CrudField[] = [
  { key: 'cliente_id', label: 'ID do cliente', keyboardType: 'number-pad' },
  { key: 'marca', label: 'Marca', autoCapitalize: 'words' },
  { key: 'modelo', label: 'Modelo', autoCapitalize: 'words' },
  { key: 'placa', label: 'Placa', autoCapitalize: 'characters' },
  { key: 'ano', label: 'Ano', keyboardType: 'number-pad' },
  { key: 'cor', label: 'Cor', autoCapitalize: 'words' },
];

export default function VeiculosScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { veiculos: veiculosData, clientes, createRecord, updateRecord, deleteRecord } = useDriveOnData();
  const [busca, setBusca] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const detectedPlate = route.params?.detectedPlate;

    if (typeof detectedPlate === 'string') {
      setBusca(detectedPlate);
    }
  }, [route.params?.detectedPlate]);

  const veiculos = veiculosData.filter(v => {
    const cliente = clientes.find(c => c.id === v.clienteId);
    return v.placa.toLowerCase().includes(busca.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busca.toLowerCase()) ||
      cliente?.nome.toLowerCase().includes(busca.toLowerCase());
  });

  const openForm = (item?: (typeof veiculosData)[number]) => {
    setEditingId(item?.id ?? null);
    setForm(item ? {
      cliente_id: String(item.clienteId),
      marca: item.marca,
      modelo: item.modelo,
      placa: item.placa,
      ano: String(item.ano || ''),
      cor: item.cor,
    } : { cliente_id: clientes[0]?.id ? String(clientes[0].id) : '' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.cliente_id || !form.marca?.trim() || !form.modelo?.trim() || !form.placa?.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe cliente, marca, modelo e placa.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        cliente_id: Number(form.cliente_id),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        placa: form.placa.trim(),
        ano: form.ano ? Number(form.ano) : null,
        cor: form.cor?.trim() || null,
      };
      if (editingId) await updateRecord('/veiculos', editingId, payload);
      else await createRecord('/veiculos', payload);
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Nao foi possivel salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    Alert.alert('Remover veiculo?', 'Essa acao desativa o registro.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/veiculos', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };


  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={20} color="#9E9E9E" style={{ marginRight: spacing.sm }} />
        <RNTextInput placeholder="Buscar por placa, modelo ou cliente..." value={busca} onChangeText={setBusca} style={styles.searchInput} placeholderTextColor="#BDBDBD" />
      </View>
      <FlatList
        data={veiculos}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: insets.bottom + 80 }}
        renderItem={({ item: v }) => {
          const cliente = clientes.find(c => c.id === v.clienteId);
          return (
            <TouchableOpacity onPress={() => openForm(v)} activeOpacity={0.8}>
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardRow}>
                <View style={styles.carIcon}><MaterialIcons name="directions-car" size={28} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modelo}>{v.marca} {v.modelo} {v.ano}</Text>
                  <View style={styles.placaRow}>
                    <View style={styles.placaBadge}><Text style={styles.placaText}>{v.placa}</Text></View>
                    <Text style={styles.cor}>• {v.cor}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="person" size={13} color="#9E9E9E" />
                    <Text style={styles.clienteText}>{cliente?.nome ?? '—'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="speed" size={13} color="#9E9E9E" />
                    <Text style={styles.kmText}>{v.km.toLocaleString('pt-BR')} km</Text>
                  </View>
                </View>
                <IconButton icon="delete-outline" size={20} iconColor="#D32F2F" onPress={() => remove(v.id)} />
              </View>
            </Surface>
            </TouchableOpacity>
          );
        }}
      />
      <FAB icon="camera" style={[styles.cameraFab, { bottom: insets.bottom + 92 }]} color="#FFF" onPress={() => navigation.navigate('PlacaScanner')} />
      <CrudDialog visible={dialogOpen} title={editingId ? 'Editar veiculo' : 'Novo veiculo'} fields={fields} values={form} isSaving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setDialogOpen(false)} onSave={save} />
      <FAB icon="plus" style={[styles.fab, { bottom: insets.bottom + 24 }]} color="#FFF" onPress={() => openForm()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 10, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: colors.onBackground },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  carIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  modelo: { fontSize: 15, fontWeight: '700', color: colors.onBackground },
  placaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  placaBadge: { backgroundColor: '#37474F', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  placaText: { color: '#FFF', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  cor: { fontSize: 12, color: '#757575' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  clienteText: { fontSize: 12, color: '#757575' },
  kmText: { fontSize: 12, color: '#757575' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary },
  cameraFab: { position: 'absolute', bottom: 92, right: 24, backgroundColor: colors.secondary },
});
