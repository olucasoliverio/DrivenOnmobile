import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput as RNTextInput, Modal } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import CrudDialog, { type CrudField } from '../../components/CrudDialog';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { palette, spacing, borderRadius, shadows, gradients } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import { sendWelcomeMessage } from '../../services/whatsappService';



const fields: CrudField[] = [
  { key: 'nome', label: 'Nome', autoCapitalize: 'words' },
  { key: 'telefone', label: 'Telefone', keyboardType: 'phone-pad' },
  { key: 'email', label: 'E-mail', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'cpf', label: 'CPF', keyboardType: 'number-pad' },
  { key: 'observacoes', label: 'Observações', multiline: true },
];

export default function ClientesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { clientes: clientesData, veiculos, ordens, createCliente } = useDriveOnData();
  const [busca, setBusca] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    if (route.params?.openForm) {
      setIsFormOpen(true);
      navigation.setParams({ openForm: undefined });
    }
  }, [route.params?.openForm]);
  const [isSaving, setIsSaving] = useState(false);
  const [isWelcomeModalVisible, setIsWelcomeModalVisible] = useState(false);
  const [registeredCliente, setRegisteredCliente] = useState<{ nome: string; telefone: string } | null>(null);
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
      const novoCliente = await createCliente({
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        cpf: form.cpf.trim(),
        observacoes: form.observacoes.trim(),
      });
      resetForm();
      setIsFormOpen(false);

      if (novoCliente?.telefone) {
        setRegisteredCliente({ nome: novoCliente.nome, telefone: novoCliente.telefone });
        setIsWelcomeModalVisible(true);
      }
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
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <EmptyState
            icon="people"
            message={busca.length > 0 ? 'Nenhum cliente encontrado para esta busca' : 'Nenhum cliente cadastrado'}
            isFullPage
          />
        )}
        renderItem={({ item: cliente, index }) => {
          const veiculosCount = veiculos.filter(v => v.clienteId === cliente.id).length;
          const ordensCount = ordens.filter(o => o.clienteId === cliente.id).length;
          const isFirst = index === 0;
          const isLast = index === clientes.length - 1;
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('ClienteDetalhes', { clienteId: cliente.id })}
              activeOpacity={0.8}
            >
              <View style={[
                styles.listItem,
                isFirst && styles.listItemFirst,
                isLast && styles.listItemLast,
                !isLast && styles.listItemBorder
              ]}>
                {/* Avatar circular neutro e maduro */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{cliente.nome.substring(0, 2).toUpperCase()}</Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nome} numberOfLines={1}>{cliente.nome}</Text>
                      <View style={styles.infoMetaRow}>
                        <MaterialIcons name="phone" size={13} color={palette.slate400} />
                        <Text style={styles.infoText}>{cliente.telefone}</Text>

                        <Text style={styles.metaDivider}>•</Text>
                        <MaterialIcons name="directions-car" size={13} color={palette.slate400} />
                        <Text style={styles.metaText}>{veiculosCount} {veiculosCount === 1 ? 'veículo' : 'veículos'}</Text>

                        <Text style={styles.metaDivider}>•</Text>
                        <MaterialIcons name="build" size={13} color={palette.slate400} />
                        <Text style={styles.metaText}>{ordensCount} OS</Text>

                        {cliente.cidade ? (
                          <>
                            <Text style={styles.metaDivider}>•</Text>
                            <MaterialIcons name="location-city" size={13} color={palette.slate400} />
                            <Text style={styles.metaText}>{cliente.cidade}</Text>
                          </>
                        ) : null}
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={palette.slate300} style={{ marginLeft: spacing.sm }} />
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

      {/* ── Welcome Message Confirm Modal ── */}
      <Modal
        visible={isWelcomeModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setIsWelcomeModalVisible(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogContent}>
            <View style={[styles.dialogIconBox, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="whatsapp" size={36} color="#25D366" />
            </View>
            
            <Text style={styles.dialogTitle}>Cliente Cadastrado!</Text>
            <Text style={styles.dialogDescription}>
              Deseja enviar uma mensagem de boas-vindas no WhatsApp de *{registeredCliente?.nome}*?
            </Text>

            <View style={styles.dialogActionRow}>
              <TouchableOpacity
                style={styles.dialogCancelButton}
                activeOpacity={0.7}
                onPress={() => setIsWelcomeModalVisible(false)}
              >
                <Text style={styles.dialogCancelButtonText}>Não</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogConfirmButton}
                activeOpacity={0.8}
                onPress={() => {
                  setIsWelcomeModalVisible(false);
                  if (registeredCliente) {
                    sendWelcomeMessage(registeredCliente.nome, registeredCliente.telefone);
                  }
                }}
              >
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  style={styles.dialogConfirmButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.dialogConfirmButtonText}>Sim, enviar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 110, 
  },

  listItem: { 
    backgroundColor: palette.white, 
    padding: spacing.md, 
    flexDirection: 'row', 
    gap: spacing.md, 
    alignItems: 'center', 
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: palette.slate200,
  },
  listItemFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  listItemLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    ...shadows.sm,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF2',
  },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    color: palette.slate700, 
    fontWeight: '700', 
    fontSize: 14 
  },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  nome: { fontSize: 16, fontWeight: '800', color: palette.slate900, marginBottom: 2, letterSpacing: -0.2 },
  infoMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flexWrap: 'wrap', 
    marginTop: 4,
    gap: 4
  },
  infoText: { fontSize: 12, color: palette.slate500, fontWeight: '500' },
  metaDivider: { marginHorizontal: 4, color: palette.slate300, fontSize: 12 },
  metaText: { fontSize: 12, color: palette.slate500, fontWeight: '500' },

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

  // Centered Confirm Dialog Modal
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialogContent: {
    width: '100%',
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  dialogIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.slate900,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dialogDescription: {
    fontSize: 13,
    color: palette.slate500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  dialogActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  dialogCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
  },
  dialogCancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate700,
  },
  dialogConfirmButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  dialogConfirmButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogConfirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.white,
  },
});

