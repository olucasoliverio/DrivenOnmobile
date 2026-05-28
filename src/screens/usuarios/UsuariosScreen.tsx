import React from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Surface, FAB, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { colors, spacing, borderRadius } from '../../theme/theme';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const perfilConfig: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: '#1565C0' },
  mecanico: { label: 'Mecânico', color: '#E65100' },
  atendente: { label: 'Atendente', color: '#2E7D32' },
};

const fields: CrudField[] = [
  { key: 'nome', label: 'Nome', autoCapitalize: 'words' },
  { key: 'email', label: 'E-mail', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'senha', label: 'Senha' },
  { key: 'tipo', label: 'Tipo (funcionario, gestoroficina)' },
  { key: 'status', label: 'Status (ativo, inativo)' },
];

export default function UsuariosScreen() {
  const insets = useSafeAreaInsets();
  const { usuarios, createRecord, updateRecord, deleteRecord } = useDriveOnData();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string>>({});

  const openForm = (item?: (typeof usuarios)[number]) => {
    setEditingId(item?.id ?? null);
    setForm(item ? {
      nome: item.nome,
      email: item.email,
      senha: '',
      tipo: item.perfil || 'funcionario',
      status: item.status || 'ativo',
    } : { tipo: 'funcionario', status: 'ativo' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.nome?.trim() || !form.email?.trim() || (!editingId && !form.senha?.trim())) {
      Alert.alert('Campos obrigatorios', 'Informe nome, e-mail e senha.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        tipo: form.tipo?.trim() || 'funcionario',
        status: form.status?.trim() || 'ativo',
      };
      if (form.senha?.trim()) payload.senha = form.senha.trim();
      if (editingId) await updateRecord('/usuario', editingId, payload);
      else await createRecord('/usuario', payload);
      setDialogOpen(false);
    } catch (error: any) {
      Alert.alert('Nao foi possivel salvar', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    Alert.alert('Remover usuario?', 'Essa acao desativa o usuario.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await deleteRecord('/usuario', id); }
        catch (error: any) { Alert.alert('Nao foi possivel remover', error?.response?.data?.error ?? error?.message ?? 'Tente novamente.'); }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={usuarios}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 160 }}
        renderItem={({ item: u }) => {
          const perfil = perfilConfig[u.perfil] ?? { label: u.perfil, color: '#757575' };
          return (
            <TouchableOpacity onPress={() => openForm(u)} activeOpacity={0.8}>
            <Surface style={styles.card} elevation={1}>
              <View style={styles.cardRow}>
                <View style={[styles.avatar, { backgroundColor: perfil.color }]}>
                  <Text style={styles.avatarText}>{u.nome.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{u.nome}</Text>
                  <View style={styles.infoRow}><MaterialIcons name="email" size={13} color="#9E9E9E" /><Text style={styles.infoText}>{u.email}</Text></View>
                  <View style={styles.infoRow}><MaterialIcons name="phone" size={13} color="#9E9E9E" /><Text style={styles.infoText}>{u.telefone}</Text></View>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: perfil.color + '15' }]}>
                      <Text style={[styles.badgeText, { color: perfil.color }]}>{perfil.label}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: u.status === 'ativo' ? '#E8F5E9' : '#FFEBEE' }]}>
                      <Text style={[styles.badgeText, { color: u.status === 'ativo' ? '#2E7D32' : '#D32F2F' }]}>
                        {u.status === 'ativo' ? 'ATIVO' : 'INATIVO'}
                      </Text>
                    </View>
                  </View>
                </View>
                <IconButton icon="delete-outline" size={20} iconColor="#D32F2F" onPress={() => remove(u.id)} />
              </View>
            </Surface>
            </TouchableOpacity>
          );
        }}
      />
      <CrudDialog visible={dialogOpen} title={editingId ? 'Editar usuario' : 'Novo usuario'} fields={fields} values={form} isSaving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setDialogOpen(false)} onSave={save} />
      <FAB icon="plus" style={styles.fab} color="#FFF" onPress={() => openForm()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { borderRadius: borderRadius.md, padding: spacing.md, backgroundColor: '#FFF' },
  cardRow: { flexDirection: 'row', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  nome: { fontSize: 15, fontWeight: '700', color: colors.onBackground, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  infoText: { fontSize: 12, color: '#757575' },
  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 96, right: 20, backgroundColor: colors.primary, borderRadius: 16, elevation: 8 },
});
