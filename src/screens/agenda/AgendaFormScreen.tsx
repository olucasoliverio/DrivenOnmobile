import React, { useState, useEffect } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  TextInput as RNTextInput,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { useAuth } from '../../context/AuthContext';
import { palette, spacing, borderRadius, shadows } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';
import CalendarDatePicker from '../../components/CalendarDatePicker';
import LoadingState from '../../components/LoadingState';
import dayjs from 'dayjs';
import { getFriendlyErrorMessage, isValidTime } from '../../utils/errorMessages';

export default function AgendaFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { agendamentoId } = route.params ?? {};
  const { agendamentos, clientes, veiculos, createRecord, updateRecord, configuracoes, isLoading } = useDriveOnData();
  const { can } = useAuth();

  const isEditing = agendamentoId != null;

  useEffect(() => {
    const action = isEditing ? 'update' : 'create';
    if (!can('agenda', action) || configuracoes?.recursosAdicionais?.agenda === false) {
      navigation.goBack();
    }
  }, [can, configuracoes, isEditing, navigation]);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    servico: '',
    data: dayjs().format('YYYY-MM-DD'),
    horaInicio: '09:00',
    horaFim: '10:00',
    status: 'pendente',
    clienteId: null as number | null,
    clienteNome: '',
    veiculoId: null as number | null,
    veiculoLabel: '',
    observacao: '',
  });

  // Picker modal states
  const [clienteModalVisible, setClienteModalVisible] = useState(false);
  const [veiculoModalVisible, setVeiculoModalVisible] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [veiculoSearch, setVeiculoSearch] = useState('');

  // Load data for editing
  useEffect(() => {
    if (isEditing) {
      const ag = agendamentos.find(a => a.id === Number(agendamentoId));
      if (!ag) return;
      const cliente = clientes.find(c => c.id === ag.clienteId);
      const veiculo = veiculos.find(v => v.id === ag.veiculoId);
      setForm({
        servico: ag.servico || '',
        data: dayjs(ag.data).format('YYYY-MM-DD'),
        horaInicio: ag.hora || '09:00',
        horaFim: '',
        status: ag.status || 'pendente',
        clienteId: ag.clienteId,
        clienteNome: cliente?.nome || '',
        veiculoId: ag.veiculoId,
        veiculoLabel: veiculo ? `${veiculo.marca} ${veiculo.modelo} · ${veiculo.placa}` : '',
        observacao: ag.observacao || '',
      });
    }
  }, [isEditing, agendamentoId, agendamentos, clientes, veiculos]);

  const handleSave = async () => {
    if (!form.servico.trim() || !form.data || !form.horaInicio || !form.clienteId || !form.veiculoId) {
      Alert.alert('Campos obrigatórios', 'Informe serviço, data, horário, cliente e veículo.');
      return;
    }
    if (!isValidTime(form.horaInicio) || (form.horaFim && !isValidTime(form.horaFim))) {
      Alert.alert('Horário inválido', 'Informe o horário no formato HH:mm, por exemplo 09:30.');
      return;
    }

    const start = dayjs(`${form.data} ${form.horaInicio}`);
    const end = form.horaFim
      ? dayjs(`${form.data} ${form.horaFim}`)
      : start.add(1, 'hour');

    if (!start.isValid() || !end.isValid()) {
      Alert.alert('Data inválida', 'Verifique a data e o horário do agendamento.');
      return;
    }
    if (!end.isAfter(start)) {
      Alert.alert('Horário inválido', 'O horário de término precisa ser depois do horário de início.');
      return;
    }
    setSaving(true);
    try {
      const dataInicio = start.toISOString();
      const dataFim = end.toISOString();

      if (isEditing) {
        const payload = {
          titulo: form.servico.trim(),
          cliente_id: form.clienteId,
          veiculo_id: form.veiculoId,
          data_inicio: dataInicio,
          data_fim: dataFim,
          status: form.status,
          observacao: form.observacao.trim() || null,
        };
        await updateRecord('/agendamentos', Number(agendamentoId), payload);
      } else {
        const payload = {
          titulo: form.servico.trim(),
          cliente_id: form.clienteId,
          veiculo_id: form.veiculoId,
          data_inicio: dataInicio,
          data_fim: dataFim,
          observacao: form.observacao.trim() || null,
        };
        await createRecord('/agendamentos', payload);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Não foi possível salvar', getFriendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Filtered lists for modals
  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const filteredVeiculos = form.clienteId
    ? veiculos.filter(v =>
        String(v.clienteId) === String(form.clienteId) &&
        (`${v.marca} ${v.modelo} ${v.placa}`).toLowerCase().includes(veiculoSearch.toLowerCase())
      )
    : [];
  const selectedClienteVeiculos = form.clienteId
    ? veiculos.filter(v => String(v.clienteId) === String(form.clienteId))
    : [];
  const canCreateVehicle = can('veiculos', 'create');
  const selectedClientHasNoVehicles = !!form.clienteId && selectedClienteVeiculos.length === 0;

  const handleCreateVehicleForSelectedClient = () => {
    if (!form.clienteId) return;
    setVeiculoModalVisible(false);
    setVeiculoSearch('');
    navigation.navigate('VeiculoForm', { clienteId: form.clienteId });
  };

  useEffect(() => {
    if (!form.clienteId) return;
    if (form.veiculoId && selectedClienteVeiculos.some(v => v.id === form.veiculoId)) return;
    if (selectedClienteVeiculos.length !== 1) return;

    const [onlyVehicle] = selectedClienteVeiculos;
    setForm(curr => (
      curr.veiculoId === onlyVehicle.id
        ? curr
        : {
            ...curr,
            veiculoId: onlyVehicle.id,
            veiculoLabel: `${onlyVehicle.marca} ${onlyVehicle.modelo} · ${onlyVehicle.placa}`,
          }
    ));
  }, [form.clienteId, form.veiculoId, selectedClienteVeiculos]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
        subtitle={isEditing ? 'Atualize os dados do compromisso' : 'Preencha os dados do agendamento'}
        showBack={true}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Card 1: Serviço */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="build" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Serviço</Text>
            </View>
            <TextInput
              label="Serviço / Título *"
              value={form.servico}
              onChangeText={val => setForm(curr => ({ ...curr, servico: val }))}
              mode="outlined"
              style={styles.input}
              autoCapitalize="sentences"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="wrench" color={palette.slate400} />}
            />
          </View>

          {/* Card 2: Data e Horário */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="calendar-today" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Data e Horário</Text>
            </View>
            <TouchableOpacity
              style={[styles.pickerField, styles.input, form.data && styles.pickerFieldFilled]}
              activeOpacity={0.75}
              onPress={() => setDatePickerOpen(true)}
            >
              <View style={styles.pickerIcon}>
                <MaterialIcons name="calendar-today" size={18} color={palette.navy800} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerLabel}>Data *</Text>
                <Text style={styles.pickerValue}>{dayjs(form.data).format('DD/MM/YYYY')}</Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color={palette.slate400} />
            </TouchableOpacity>
            <TextInput
              label="Horário de Início (HH:mm) *"
              value={form.horaInicio}
              onChangeText={val => setForm(curr => ({ ...curr, horaInicio: val }))}
              mode="outlined"
              style={styles.input}
              keyboardType="default"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="clock-outline" color={palette.slate400} />}
              maxLength={5}
            />
            {!isEditing && (
              <TextInput
                label="Horário de Término (HH:mm)"
                value={form.horaFim}
                onChangeText={val => setForm(curr => ({ ...curr, horaFim: val }))}
                mode="outlined"
                style={styles.input}
                keyboardType="default"
                activeOutlineColor={palette.navy800}
                outlineColor={palette.slate200}
                outlineStyle={{ borderRadius: borderRadius.md }}
                theme={{ colors: { background: palette.slate50 } }}
                left={<TextInput.Icon icon="clock-check-outline" color={palette.slate400} />}
                maxLength={5}
              />
            )}
          </View>

          {/* Card 3: Status (ONLY in edit mode) */}
          {isEditing && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="flag" size={20} color={palette.navy800} />
                <Text style={styles.cardTitle}>Status</Text>
              </View>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    form.status === 'confirmado' && styles.chipSelected,
                    form.status === 'confirmado' && { backgroundColor: palette.emerald600 },
                  ]}
                  onPress={() => setForm(curr => ({ ...curr, status: 'confirmado' }))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, form.status === 'confirmado' && styles.chipTextSelected]}>
                    Confirmado
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    form.status === 'pendente' && styles.chipSelected,
                    form.status === 'pendente' && { backgroundColor: palette.amber500 },
                  ]}
                  onPress={() => setForm(curr => ({ ...curr, status: 'pendente' }))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, form.status === 'pendente' && styles.chipTextSelected]}>
                    Pendente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Card 4: Associação */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="link" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Associação</Text>
            </View>

            {/* Cliente picker */}
            <TouchableOpacity
              style={[styles.pickerField, form.clienteId != null && styles.pickerFieldFilled]}
              activeOpacity={0.7}
              onPress={() => setClienteModalVisible(true)}
            >
              <View style={styles.pickerIcon}>
                <MaterialIcons name="person" size={18} color={palette.navy800} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerLabel}>Cliente *</Text>
                <Text style={[styles.pickerValue, form.clienteId == null && styles.pickerPlaceholder]}>
                  {form.clienteNome || 'Toque para selecionar um cliente'}
                </Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color={palette.slate400} />
            </TouchableOpacity>

            {/* Veículo picker */}
            <TouchableOpacity
              style={[
                styles.pickerField,
                { marginTop: spacing.md },
                form.veiculoId != null && styles.pickerFieldFilled,
                (!form.clienteId || selectedClientHasNoVehicles) && { opacity: 0.5 },
              ]}
              activeOpacity={0.7}
              disabled={!form.clienteId || selectedClientHasNoVehicles}
              onPress={() => setVeiculoModalVisible(true)}
            >
              <View style={styles.pickerIcon}>
                <MaterialIcons name="directions-car" size={18} color={palette.navy800} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerLabel}>Veículo *</Text>
                <Text style={[styles.pickerValue, form.veiculoId == null && styles.pickerPlaceholder]}>
                  {form.veiculoLabel || (
                    selectedClientHasNoVehicles
                      ? 'Nenhum veículo cadastrado'
                      : form.clienteId ? 'Toque para selecionar um veículo' : 'Selecione primeiro um cliente'
                  )}
                </Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color={palette.slate400} />
            </TouchableOpacity>

            {selectedClientHasNoVehicles && (
              <View style={styles.vehicleInlineEmpty}>
                <View style={styles.vehicleInlineIcon}>
                  <MaterialIcons name="directions-car" size={20} color={palette.navy800} />
                </View>
                <View style={styles.vehicleInlineContent}>
                  <Text style={styles.vehicleInlineTitle}>Este cliente ainda não tem veículo</Text>
                  <Text style={styles.vehicleInlineText}>
                    Cadastre o veículo agora para continuar preenchendo o agendamento.
                  </Text>
                  {canCreateVehicle ? (
                    <TouchableOpacity
                      style={styles.vehicleInlineButton}
                      activeOpacity={0.8}
                      onPress={handleCreateVehicleForSelectedClient}
                    >
                      <MaterialIcons name="add" size={17} color={palette.white} />
                      <Text style={styles.vehicleInlineButtonText}>Cadastrar Veículo</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.vehicleInlinePermissionText}>
                      Seu perfil não permite cadastrar veículos.
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Card 5: Observações */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="notes" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Observações</Text>
            </View>
            <TextInput
              label="Observações"
              value={form.observacao}
              onChangeText={val => setForm(curr => ({ ...curr, observacao: val }))}
              mode="outlined"
              multiline
              numberOfLines={4}
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="note-text-outline" color={palette.slate400} />}
            />
          </View>

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
            buttonColor={palette.navy800}
            textColor={palette.white}
            contentStyle={{ paddingVertical: 6 }}
            labelStyle={styles.saveBtnLabel}
          >
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Agendamento'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── MODAL SELEÇÃO CLIENTE ── */}
      <Modal
        visible={clienteModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setClienteModalVisible(false);
          setClienteSearch('');
        }}
      >
        <View style={styles.modalContainer}>
          <ScreenHeader title="Selecionar Cliente" showBack={false} />
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={palette.slate400} style={{ marginRight: spacing.sm }} />
            <RNTextInput
              style={styles.searchInput}
              placeholder="Buscar por nome..."
              placeholderTextColor={palette.slate400}
              value={clienteSearch}
              onChangeText={setClienteSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredClientes}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                activeOpacity={0.7}
                onPress={() => {
                  setForm(curr => ({
                    ...curr,
                    clienteId: item.id,
                    clienteNome: item.nome,
                    veiculoId: null,
                    veiculoLabel: '',
                  }));
                  setClienteModalVisible(false);
                  setClienteSearch('');
                }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.nome.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{item.nome}</Text>
                  {item.telefone ? (
                    <Text style={styles.listItemSub}>{item.telefone}</Text>
                  ) : null}
                </View>
                {form.clienteId === item.id && (
                  <MaterialIcons name="check-circle" size={20} color={palette.navy800} />
                )}
              </TouchableOpacity>
            )}
          />
          <Button
            mode="outlined"
            style={{ margin: spacing.lg, borderColor: palette.slate300 }}
            textColor={palette.slate500}
            onPress={() => { setClienteModalVisible(false); setClienteSearch(''); }}
          >
            Fechar
          </Button>
        </View>
      </Modal>

      {/* ── MODAL SELEÇÃO VEÍCULO ── */}
      <Modal
        visible={veiculoModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setVeiculoModalVisible(false);
          setVeiculoSearch('');
        }}
      >
        <View style={styles.modalContainer}>
          <ScreenHeader
            title={`Veículos de ${form.clienteNome || 'Cliente'}`}
            showBack={false}
          />
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={20} color={palette.slate400} style={{ marginRight: spacing.sm }} />
            <RNTextInput
              style={styles.searchInput}
              placeholder="Buscar por marca, modelo ou placa..."
              placeholderTextColor={palette.slate400}
              value={veiculoSearch}
              onChangeText={setVeiculoSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredVeiculos}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 40 }}
            ListHeaderComponent={() => (
              form.clienteId && selectedClienteVeiculos.length > 0 && canCreateVehicle ? (
                <TouchableOpacity
                  style={styles.modalCreateVehicleButton}
                  activeOpacity={0.8}
                  onPress={handleCreateVehicleForSelectedClient}
                >
                  <View style={styles.modalCreateVehicleIcon}>
                    <MaterialIcons name="add" size={20} color={palette.navy800} />
                  </View>
                  <View style={styles.modalCreateVehicleTextBlock}>
                    <Text style={styles.modalCreateVehicleTitle}>Cadastrar novo veículo</Text>
                    <Text style={styles.modalCreateVehicleSubtitle}>Já vinculado a {form.clienteNome || 'este cliente'}</Text>
                  </View>
                </TouchableOpacity>
              ) : null
            )}
            ListEmptyComponent={() => (
              isLoading ? (
                <LoadingState message="Carregando veiculos..." helper="Buscando os veiculos do cliente." />
              ) : (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <MaterialIcons name="directions-car" size={40} color={palette.slate300} />
                  <Text style={{ color: palette.slate400, marginTop: spacing.sm, fontWeight: '600' }}>
                    Nenhum veículo encontrado para este cliente
                  </Text>
                </View>
              )
            )}
            renderItem={({ item }) => {
              const label = `${item.marca} ${item.modelo} · ${item.placa}`;
              return (
                <TouchableOpacity
                  style={[styles.listItem, form.veiculoId === item.id && styles.listItemSelected]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setForm(curr => ({
                      ...curr,
                      veiculoId: item.id,
                      veiculoLabel: label,
                    }));
                    setVeiculoModalVisible(false);
                    setVeiculoSearch('');
                  }}
                >
                  <View style={[styles.avatar, { backgroundColor: palette.navy50 }]}>
                    <MaterialIcons name="directions-car" size={18} color={palette.navy800} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemTitle}>{item.marca} {item.modelo}</Text>
                    <Text style={styles.listItemSub}>Placa: {item.placa}</Text>
                  </View>
                  {form.veiculoId === item.id && (
                    <MaterialIcons name="check-circle" size={20} color={palette.navy800} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
          <Button
            mode="outlined"
            style={{ margin: spacing.lg, borderColor: palette.slate300 }}
            textColor={palette.slate500}
            onPress={() => { setVeiculoModalVisible(false); setVeiculoSearch(''); }}
          >
            Fechar
          </Button>
        </View>
      </Modal>

      <CalendarDatePicker
        visible={datePickerOpen}
        value={form.data}
        title="Data do Agendamento"
        onSelect={date => setForm(curr => ({ ...curr, data: date }))}
        onClose={() => setDatePickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },
  keyboardView: { flex: 1, backgroundColor: palette.slate100 },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },

  // Card
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

  // Input
  input: {
    marginBottom: spacing.md,
    fontSize: 14,
  },

  // Row
  row: { flexDirection: 'row', gap: spacing.md },

  // Save button
  saveButton: {
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  saveBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Chips (status)
  chipsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.slate100,
  },
  chipSelected: { borderColor: 'transparent' },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.slate500 },
  chipTextSelected: { color: palette.white, fontWeight: '700' },

  // Picker field
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.slate50,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pickerFieldFilled: {
    borderColor: palette.navy800,
    backgroundColor: palette.navy50,
  },
  pickerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: palette.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  pickerLabel: {
    fontSize: 11,
    color: palette.slate400,
    fontWeight: '600',
    marginBottom: 2,
  },
  pickerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
  pickerPlaceholder: {
    color: palette.slate400,
    fontWeight: '500',
  },
  vehicleInlineEmpty: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: palette.navy50,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  vehicleInlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInlineContent: {
    flex: 1,
  },
  vehicleInlineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.slate900,
  },
  vehicleInlineText: {
    fontSize: 12,
    color: palette.slate500,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 3,
  },
  vehicleInlineButton: {
    minHeight: 40,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: palette.navy800,
  },
  vehicleInlineButtonText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
  },
  vehicleInlinePermissionText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: palette.slate500,
    fontWeight: '700',
  },

  // Modal
  modalContainer: { flex: 1, backgroundColor: palette.slate100 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.slate200,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: palette.slate900,
    fontWeight: '500',
  },
  modalCreateVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.navy50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  modalCreateVehicleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCreateVehicleTextBlock: {
    flex: 1,
  },
  modalCreateVehicleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.slate900,
  },
  modalCreateVehicleSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate500,
    marginTop: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    gap: spacing.md,
    ...shadows.sm,
  },
  listItemSelected: {
    borderColor: palette.navy800,
    borderWidth: 2,
    backgroundColor: palette.navy50,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
  listItemSub: {
    fontSize: 12,
    color: palette.slate400,
    marginTop: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.navy800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.white,
  },
});
