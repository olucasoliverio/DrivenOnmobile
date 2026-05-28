import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // usado nos avatares
import { MaterialIcons } from '@expo/vector-icons';
import { FAB } from 'react-native-paper';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useNavigation } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';

// Cores de avatar por índice (rotação com gradientes premium)
const AVATAR_COLORS = [
  [palette.navy800, palette.navy600],
  ['#8B5CF6', '#A78BFA'],
  ['#10B981', '#34D399'],
  ['#EF4444', '#F87171'],
  ['#F59E0B', '#FBBF24'],
] as [string, string][];

const fields: CrudField[] = [
  { key: 'nome', label: 'Nome', autoCapitalize: 'words' },
  { key: 'telefone', label: 'Telefone', keyboardType: 'phone-pad' },
  { key: 'email', label: 'E-mail', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'cpf', label: 'CPF', keyboardType: 'number-pad' },
  { key: 'observacoes', label: 'Observações', multiline: true },
];

export default function ClientesScreen() {
  const navigation = useNavigation<any>();
  const { clientes: clientesData, veiculos, ordens, createCliente } = useDriveOnData();
  const [busca, setBusca] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    observacoes: '',
  });

  const clientes = clientesData.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca) ||
    c.cpf.includes(busca)
  );

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm({ nome: '', telefone: '', email: '', cpf: '', observacoes: '' });
  };

  const handleCreateCliente = async () => {
    if (!form.nome.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do cliente para cadastrar.');
      return;
    }

    setIsSaving(true);
    try {
      await createCliente({
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        cpf: form.cpf.trim(),
        observacoes: form.observacoes.trim(),
      });
      resetForm();
      setIsFormOpen(false);
    } catch (error: any) {
      Alert.alert(
        'Não foi possível cadastrar',
        error?.response?.data?.error ?? error?.response?.data?.message ?? error?.message ?? 'Tente novamente.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* ── Header padrão ─── */}
      <ScreenHeader
        title="Clientes"
        subtitle={`${clientesData.length} cadastrado${clientesData.length !== 1 ? 's' : ''}`}
        showBack
      />

      {/* ── Search (overlapping com borda suave) ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={palette.slate400} />
          <RNTextInput
            placeholder="Buscar cliente, CPF, telefone..."
            value={busca}
            onChangeText={setBusca}
            style={styles.searchInput}
            placeholderTextColor={palette.slate400}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.closeSearchBtn}>
              <MaterialIcons name="close" size={18} color={palette.slate400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Lista Redesenhada ── */}
      <FlatList
        data={clientes}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <MaterialIcons name="people-outline" size={56} color={palette.slate300} />
            <Text style={styles.emptyTitle}>Nenhum cliente</Text>
            <Text style={styles.emptyText}>Tente ajustar os termos da busca</Text>
          </View>
        )}
        renderItem={({ item: cliente, index }) => {
          const veiculosCount = veiculos.filter(v => v.clienteId === cliente.id).length;
          const ordensCount = ordens.filter(o => o.clienteId === cliente.id).length;
          const avatarColors = AVATAR_COLORS[index % AVATAR_COLORS.length];
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('ClienteDetalhes', { clienteId: cliente.id })}
              activeOpacity={0.8}
            >
              <View style={styles.card}>
                {/* Avatar circular com gradiente suave */}
                <LinearGradient colors={avatarColors} style={styles.avatar}>
                  <Text style={styles.avatarText}>{cliente.nome.substring(0, 2).toUpperCase()}</Text>
                </LinearGradient>

                <View style={styles.cardBody}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nome} numberOfLines={1}>{cliente.nome}</Text>
                      <View style={styles.infoRow}>
                        <MaterialIcons name="phone" size={12} color={palette.slate400} />
                        <Text style={styles.infoText}>{cliente.telefone}</Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={palette.slate300} />
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statChip}>
                      <MaterialIcons name="directions-car" size={13} color={palette.navy800} />
                      <Text style={styles.statText}>{veiculosCount} veículo{veiculosCount !== 1 ? 's' : ''}</Text>
                    </View>
                    <View style={[styles.statChip, styles.statChipAlert]}>
                      <MaterialIcons name="build" size={13} color="#B45309" />
                      <Text style={[styles.statText, { color: '#B45309' }]}>{ordensCount} OS</Text>
                    </View>
                    {cliente.cidade ? (
                      <View style={[styles.statChip, styles.statChipNeutral]}>
                        <MaterialIcons name="location-city" size={13} color={palette.slate500} />
                        <Text style={[styles.statText, { color: palette.slate500 }]}>{cliente.cidade}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <CrudDialog
        visible={isFormOpen}
        title="Novo cliente"
        fields={fields}
        values={form}
        isSaving={isSaving}
        onChange={(key, value) => updateForm(key as any, value)}
        onCancel={() => setIsFormOpen(false)}
        onSave={handleCreateCliente}
      />

      {/* FAB ajustado para ficar acima do Tab Bar flutuante */}
      <FAB 
        icon="plus" 
        style={styles.fab} 
        color={palette.white} 
        onPress={() => setIsFormOpen(true)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },

  searchContainer: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.lg, 
    paddingHorizontal: spacing.md, 
    height: 52, 
    gap: spacing.sm, 
    borderWidth: 1, 
    borderColor: 'rgba(15, 23, 42, 0.05)', 
    ...shadows.md 
  },
  searchInput: { flex: 1, fontSize: 14, color: palette.slate900, fontWeight: '500' },
  closeSearchBtn: { padding: 4 },

  listContent: { 
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.md, 
    paddingBottom: 80, 
    gap: spacing.sm, 
  },

  card: { 
    backgroundColor: palette.white, 
    borderRadius: borderRadius.lg, 
    padding: spacing.md, 
    flexDirection: 'row', 
    gap: spacing.md, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(15, 23, 42, 0.04)', 
    ...shadows.sm 
  },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: palette.white, fontWeight: '900', fontSize: 15 },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  nome: { fontSize: 16, fontWeight: '800', color: palette.slate900, marginBottom: 2, letterSpacing: -0.2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: palette.slate500, fontWeight: '500' },

  statsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: spacing.sm },
  statChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(37, 99, 235, 0.05)', 
    borderRadius: borderRadius.full, 
    paddingHorizontal: 8, 
    paddingVertical: 3 
  },
  statChipAlert: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  statChipNeutral: {
    backgroundColor: palette.slate100,
  },
  statText: { fontSize: 11, fontWeight: '700', color: palette.navy800 },

  empty: { alignItems: 'center', marginTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: palette.slate700, letterSpacing: -0.3 },
  emptyText: { fontSize: 14, color: palette.slate400, fontWeight: '500' },

  fab: { 
    position: 'absolute', 
    bottom: 24, 
    right: 20, 
    backgroundColor: palette.navy800,
    borderRadius: borderRadius.lg,
    ...shadows.lg
  },
});

