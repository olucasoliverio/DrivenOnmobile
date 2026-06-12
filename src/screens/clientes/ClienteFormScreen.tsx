import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { useAuth } from '../../context/AuthContext';
import { palette, spacing, borderRadius, shadows } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';
import api from '../../api/api';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

function formatTelefone(val: string): string {
  const clean = val.replace(/\D/g, '');
  const len = clean.length;
  if (len === 0) return '';
  if (len <= 2) return `(${clean}`;
  if (len <= 3) return `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
  if (len <= 11) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 3)} ${clean.substring(3)}`;
  }
  return `(${clean.substring(0, 2)}) ${clean.substring(2, 3)} ${clean.substring(3, 11)}`;
}

function formatCep(val: string): string {
  const clean = val.replace(/\D/g, '');
  const len = clean.length;
  if (len === 0) return '';
  if (len <= 5) return clean;
  return `${clean.substring(0, 5)}-${clean.substring(5, 8)}`;
}

export default function ClienteFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { clienteId } = route.params ?? {};
  const { clientes, createCliente, updateRecord } = useDriveOnData();
  const { can } = useAuth();
  const cepRequestRef = React.useRef(0);

  const isEditing = clienteId != null;
  const cliente = isEditing ? clientes.find(c => c.id === Number(clienteId)) : undefined;

  useEffect(() => {
    if (!can('clientes', isEditing ? 'update' : 'create')) {
      navigation.goBack();
    }
  }, [can, isEditing, navigation]);

  const [saving, setSaving] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    cidade: '',
    uf: '',
    observacoes: '',
  });

  // Load client data if editing
  useEffect(() => {
    if (isEditing && cliente) {
      setForm({
        nome: cliente.nome,
        telefone: formatTelefone(cliente.telefone),
        email: cliente.email,
        cpf: cliente.cpf,
        cep: formatCep(cliente.cep || ''),
        logradouro: cliente.logradouro || '',
        numero: cliente.numero || '',
        complemento: cliente.complemento || '',
        cidade: cliente.cidadeNome || cliente.cidade || '',
        uf: cliente.uf || '',
        observacoes: cliente.observacao || '',
      });
    }
  }, [isEditing, cliente]);

  const handleChange = async (key: keyof typeof form, value: string) => {
    if (isFetchingCep && key !== 'cep') return;

    let processed = value;
    if (key === 'telefone') {
      processed = formatTelefone(value);
    } else if (key === 'cep') {
      processed = formatCep(value);
    }

    setForm(curr => ({ ...curr, [key]: processed }));

    // Trigger ViaCEP auto-fill if CEP reaches 8 numeric digits
    if (key === 'cep') {
      const cleanCep = value.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        const requestId = cepRequestRef.current + 1;
        cepRequestRef.current = requestId;
        setIsFetchingCep(true);
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await res.json();
          if (requestId !== cepRequestRef.current) return;
          if (!data.erro) {
            setForm(curr => ({
              ...curr,
              logradouro: data.logradouro || '',
              cidade: data.localidade || '',
              uf: data.uf || '',
            }));
          } else {
            Alert.alert('CEP não encontrado', 'Confira o CEP informado e tente novamente.');
          }
        } catch (err) {
          console.error('Error fetching CEP:', err);
          if (requestId === cepRequestRef.current) {
            Alert.alert('Não foi possível buscar o CEP', 'Verifique sua conexão e tente novamente.');
          }
        } finally {
          if (requestId === cepRequestRef.current) {
            setIsFetchingCep(false);
          }
        }
      }
    }
  };

  const handleSave = async () => {
    if (isFetchingCep) {
      Alert.alert('Aguarde a busca do CEP', 'Espere a busca do endereço terminar antes de salvar.');
      return;
    }

    if (!form.nome.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do cliente.');
      return;
    }
    const telefoneDigits = form.telefone.replace(/\D/g, '');
    if (form.telefone.trim() && telefoneDigits.length < 10) {
      Alert.alert('Telefone inválido', 'Informe o telefone com DDD.');
      return;
    }

    setSaving(true);
    try {
      let cidadeId: number | undefined = undefined;

      // Resolve City/UF on Backend
      if (form.cidade.trim() && form.uf.trim()) {
        try {
          const resCidade = await api.post('/cidade', {
            nome: form.cidade.trim(),
            uf: form.uf.trim().toUpperCase(),
          });
          cidadeId = resCidade.data?.id;
        } catch (err) {
          console.error('Erro ao cadastrar/buscar cidade:', err);
        }
      }

      const payload = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        cpf: form.cpf.trim(),
        cep: form.cep.trim(),
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        cidade_id: cidadeId,
        observacoes: form.observacoes.trim(),
      };

      if (isEditing && cliente) {
        await updateRecord('/clientes', cliente.id, payload);
        navigation.goBack();
      } else {
        const novoCliente = await createCliente(payload);
        // Navigate back and pass registered client info to trigger welcome WhatsApp popup
        if (novoCliente?.telefone) {
          navigation.navigate('Clientes', {
            registeredCliente: { nome: novoCliente.nome, telefone: novoCliente.telefone }
          });
        } else {
          navigation.goBack();
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Não foi possível salvar',
        getFriendlyErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  };

  const isFormLocked = saving || isFetchingCep;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        subtitle={isEditing ? 'Atualize as informações do cliente' : 'Insira os dados cadastrais'}
        showBack={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card 1: Dados Pessoais */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person-outline" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Dados Pessoais</Text>
            </View>

            <TextInput
              label="Nome completo *"
              value={form.nome}
              onChangeText={val => handleChange('nome', val)}
              disabled={isFormLocked}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="account-outline" color={palette.slate400} />}
            />

            <TextInput
              label="Telefone"
              value={form.telefone}
              onChangeText={val => handleChange('telefone', val)}
              disabled={isFormLocked}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="phone-outline" color={palette.slate400} />}
              maxLength={15}
            />

            <TextInput
              label="E-mail"
              value={form.email}
              onChangeText={val => handleChange('email', val)}
              disabled={isFormLocked}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="email-outline" color={palette.slate400} />}
            />

            <TextInput
              label="CPF"
              value={form.cpf}
              onChangeText={val => handleChange('cpf', val)}
              disabled={isFormLocked}
              mode="outlined"
              style={styles.input}
              keyboardType="number-pad"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="card-account-details-outline" color={palette.slate400} />}
            />
          </View>

          {/* Card 2: Endereço */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="map" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Endereço</Text>
            </View>

            <TextInput
              label="CEP"
              value={form.cep}
              onChangeText={val => handleChange('cep', val)}
              disabled={isFormLocked}
              mode="outlined"
              style={styles.input}
              keyboardType="number-pad"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="map-marker-outline" color={palette.slate400} />}
              right={isFetchingCep ? (
                <TextInput.Icon
                  icon={() => <ActivityIndicator animating size={18} color={palette.navy800} />}
                />
              ) : undefined}
              maxLength={9}
            />
            {isFetchingCep && (
              <View style={styles.cepLoadingRow}>
                <ActivityIndicator animating size={14} color={palette.navy800} />
                <Text style={styles.cepLoadingText}>Buscando endereço pelo CEP...</Text>
              </View>
            )}

            <TextInput
              label="Logradouro (Rua/Avenida)"
              value={form.logradouro}
              onChangeText={val => handleChange('logradouro', val)}
              disabled={isFormLocked}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="map-marker-outline" color={palette.slate400} />}
            />

            <View style={styles.row}>
              <View style={styles.numberField}>
                <TextInput
                  label="Número"
                  value={form.numero}
                  onChangeText={val => handleChange('numero', val)}
                  disabled={isFormLocked}
                  mode="outlined"
                  keyboardType="number-pad"
                  activeOutlineColor={palette.navy800}
                  outlineColor={palette.slate200}
                  outlineStyle={{ borderRadius: borderRadius.md }}
                  theme={{ colors: { background: palette.slate50 } }}
                  left={<TextInput.Icon icon="map-marker-outline" color={palette.slate400} />}
                />
              </View>
              <View style={styles.complementField}>
                <TextInput
                  label="Complemento"
                  value={form.complemento}
                  onChangeText={val => handleChange('complemento', val)}
                  disabled={isFormLocked}
                  mode="outlined"
                  autoCapitalize="sentences"
                  activeOutlineColor={palette.navy800}
                  outlineColor={palette.slate200}
                  outlineStyle={{ borderRadius: borderRadius.md }}
                  theme={{ colors: { background: palette.slate50 } }}
                  left={<TextInput.Icon icon="map-marker-outline" color={palette.slate400} />}
                />
              </View>
            </View>

            <View style={[styles.row, { marginTop: spacing.md }]}>
              <View style={styles.cityField}>
                <TextInput
                  label="Cidade"
                  value={form.cidade}
                  onChangeText={val => handleChange('cidade', val)}
                  disabled={isFormLocked}
                  mode="outlined"
                  autoCapitalize="words"
                  activeOutlineColor={palette.navy800}
                  outlineColor={palette.slate200}
                  outlineStyle={{ borderRadius: borderRadius.md }}
                  theme={{ colors: { background: palette.slate50 } }}
                  left={<TextInput.Icon icon="map-marker-outline" color={palette.slate400} />}
                />
              </View>
              <View style={styles.ufField}>
                <TextInput
                  label="UF"
                  value={form.uf}
                  onChangeText={val => handleChange('uf', val)}
                  disabled={isFormLocked}
                  mode="outlined"
                  autoCapitalize="characters"
                  activeOutlineColor={palette.navy800}
                  outlineColor={palette.slate200}
                  outlineStyle={{ borderRadius: borderRadius.md }}
                  theme={{ colors: { background: palette.slate50 } }}
                  left={<TextInput.Icon icon="map-marker-outline" color={palette.slate400} />}
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          {/* Card 3: Observações */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="note-add" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Observações</Text>
            </View>

            <TextInput
              label="Observações do Cliente"
              value={form.observacoes}
              onChangeText={val => handleChange('observacoes', val)}
              disabled={isFormLocked}
              mode="outlined"
              multiline={true}
              numberOfLines={4}
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="note-text-outline" color={palette.slate400} />}
            />
          </View>

          {/* Botão Salvar */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={isFormLocked}
            style={styles.saveButton}
            buttonColor={palette.navy800}
            textColor={palette.white}
            contentStyle={{ paddingVertical: 6 }}
            labelStyle={styles.saveBtnLabel}
          >
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },
  keyboardView: { flex: 1, backgroundColor: palette.slate100 },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
    paddingBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.slate900,
    letterSpacing: -0.2,
  },
  input: {
    marginBottom: spacing.md,
    fontSize: 14,
  },
  cepLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  cepLoadingText: {
    fontSize: 12,
    color: palette.navy800,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  numberField: {
    flex: 1,
    minWidth: 0,
  },
  complementField: {
    flex: 1.5,
    minWidth: 0,
  },
  cityField: {
    flex: 2,
    minWidth: 0,
  },
  ufField: {
    flex: 1,
    minWidth: 0,
  },
  saveButton: {
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  saveBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
