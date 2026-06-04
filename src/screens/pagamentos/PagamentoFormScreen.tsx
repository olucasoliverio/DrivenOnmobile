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
import { getFriendlyErrorMessage, parseMoneyValue } from '../../utils/errorMessages';

export default function PagamentoFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { pagamentoId } = route.params ?? {};
  const { pagamentos, clientes, veiculos, ordens, createRecord, updateRecord, isLoading } = useDriveOnData();
  const { can } = useAuth();

  const isEditing = pagamentoId != null;

  useEffect(() => {
    if (!can('financeiro', isEditing ? 'update' : 'create')) {
      navigation.goBack();
    }
  }, [can, isEditing, navigation]);

  const [saving, setSaving] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [osModalOpen, setOsModalOpen] = useState(false);
  const [osSearch, setOsSearch] = useState('');

  const [form, setForm] = useState({
    tipo: 'receber' as const,
    valor: '',
    data_vencimento: dayjs().format('YYYY-MM-DD'),
    descricao: '',
    clienteId: null as number | null,
    clienteNome: '',
    ordem_servico_id: '',
    metodo: 'pix',
    status: 'pendente',
  });

  useEffect(() => {
    if (isEditing) {
      const p = pagamentos.find(x => x.id === Number(pagamentoId));
      if (p) {
        const cliente = clientes.find(c => c.id === p.clienteId);
        setForm({
          tipo: 'receber',
          valor: String(p.valor),
          data_vencimento: dayjs(p.data).format('YYYY-MM-DD'),
          descricao: p.descricao || '',
          clienteId: p.clienteId || null,
          clienteNome: cliente?.nome || '',
          ordem_servico_id: p.ordemId ? String(p.ordemId) : '',
          metodo: p.formaPagamento || 'pix',
          status: p.status || 'pendente',
        });
      }
    }
  }, [isEditing, pagamentoId, pagamentos, clientes]);

  const handleSave = async () => {
    if (!form.valor || !form.data_vencimento) {
      Alert.alert('Campos obrigatórios', 'Informe valor e vencimento.');
      return;
    }
    const valor = parseMoneyValue(form.valor);
    if (valor <= 0) {
      Alert.alert('Valor obrigatório', 'Informe um valor maior que R$ 0,00 para a conta.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tipo: 'receber',
        valor,
        data_vencimento: form.data_vencimento,
        descricao: form.descricao.trim() || null,
        cliente_id: form.clienteId || null,
        ordem_servico_id: form.ordem_servico_id ? Number(form.ordem_servico_id) : null,
        metodo: form.metodo,
        status: form.status,
      };
      if (isEditing) {
        await updateRecord('/pagamentos', Number(pagamentoId), payload);
      } else {
        await createRecord('/pagamentos', payload);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Não foi possível salvar', getFriendlyErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const clientesFiltrados = clientes.filter(c =>
    clienteSearch === '' ||
    c.nome.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const selectedOrdem = form.ordem_servico_id
    ? ordens.find(o => o.id === Number(form.ordem_servico_id))
    : undefined;

  const filteredOrdens = ordens.filter(os => {
    const cliente = clientes.find(c => c.id === os.clienteId);
    const veiculo = veiculos.find(v => v.id === os.veiculoId);
    const search = osSearch.toLowerCase();
    const matchesCliente = !form.clienteId || os.clienteId === form.clienteId;
    const matchesSearch =
      osSearch === '' ||
      String(os.id).includes(search) ||
      cliente?.nome.toLowerCase().includes(search) ||
      veiculo?.placa.toLowerCase().includes(search) ||
      veiculo?.modelo.toLowerCase().includes(search);
    return matchesCliente && matchesSearch;
  });

  const openCalendar = () => setCalendarModalOpen(true);

  const metodos = [
    { key: 'pix', label: 'PIX' },
    { key: 'dinheiro', label: 'Dinheiro' },
    { key: 'cartao', label: 'Cartão' },
    { key: 'boleto', label: 'Boleto' },
  ];

  const statusOpts = [
    { key: 'pendente', label: 'Pendente' },
    { key: 'pago', label: 'Pago' },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={isEditing ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
        subtitle={isEditing ? 'Atualize os dados do recebimento' : 'Cadastre uma nova receita'}
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
          {/* Card 1: Dados do Recebimento */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="attach-money" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Dados do Recebimento</Text>
            </View>

            <TextInput
              label="Valor (R$) *"
              value={form.valor}
              onChangeText={val => setForm(f => ({ ...f, valor: val }))}
              mode="outlined"
              style={styles.input}
              keyboardType="decimal-pad"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="cash" color={palette.slate400} />}
            />

            <TouchableOpacity
              style={[styles.pickerBtn, styles.input]}
              onPress={openCalendar}
              activeOpacity={0.8}
            >
              <View style={styles.pickerBtnContent}>
                <MaterialIcons name="calendar-today" size={18} color={palette.slate400} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerLabel}>Vencimento *</Text>
                  <Text style={styles.pickerValue}>
                    {dayjs(form.data_vencimento).format('DD/MM/YYYY')}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
              </View>
            </TouchableOpacity>

            <TextInput
              label="Descrição"
              value={form.descricao}
              onChangeText={val => setForm(f => ({ ...f, descricao: val }))}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="text" color={palette.slate400} />}
            />
          </View>

          {/* Card 3: Associação */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="link" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Associação (Opcional)</Text>
            </View>

            {/* Cliente Picker */}
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setClienteModalOpen(true)}
              activeOpacity={0.8}
            >
              <View style={styles.pickerBtnContent}>
                <MaterialIcons name="person-outline" size={18} color={palette.slate400} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerLabel}>Cliente</Text>
                  <Text
                    style={[styles.pickerValue, !form.clienteNome && { color: palette.slate400 }]}
                    numberOfLines={1}
                  >
                    {form.clienteNome || 'Nenhum selecionado'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
              </View>
            </TouchableOpacity>

            {form.clienteId && (
              <TouchableOpacity
                onPress={() => setForm(f => ({ ...f, clienteId: null, clienteNome: '', ordem_servico_id: '' }))}
                style={styles.clearBtn}
              >
                <MaterialIcons name="close" size={14} color={palette.rose600} />
                <Text style={styles.clearBtnText}>Remover cliente</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.pickerBtn, { marginTop: spacing.md }]}
              onPress={() => setOsModalOpen(true)}
              activeOpacity={0.8}
            >
              <View style={styles.pickerBtnContent}>
                <MaterialIcons name="engineering" size={18} color={palette.slate400} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerLabel}>Ordem de Serviço</Text>
                  <Text
                    style={[styles.pickerValue, !selectedOrdem && { color: palette.slate400 }]}
                    numberOfLines={1}
                  >
                    {selectedOrdem
                      ? `OS #${String(selectedOrdem.id).padStart(3, '0')} · R$ ${selectedOrdem.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'Nenhuma selecionada'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
              </View>
            </TouchableOpacity>

            {form.ordem_servico_id ? (
              <TouchableOpacity
                onPress={() => setForm(f => ({ ...f, ordem_servico_id: '' }))}
                style={styles.clearBtn}
              >
                <MaterialIcons name="close" size={14} color={palette.rose600} />
                <Text style={styles.clearBtnText}>Remover OS</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Card 4: Forma de Pagamento */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="credit-card" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Forma de Pagamento</Text>
            </View>

            <Text style={styles.chipGroupLabel}>Método:</Text>
            <View style={styles.chipsRow}>
              {metodos.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.chip, form.metodo === m.key && styles.chipActive]}
                  onPress={() => setForm(f => ({ ...f, metodo: m.key }))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.chipText, form.metodo === m.key && styles.chipTextActive]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.chipGroupLabel, { marginTop: spacing.md }]}>Status:</Text>
            <View style={styles.chipsRow}>
              {statusOpts.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.chip, form.status === s.key && styles.chipActive]}
                  onPress={() => setForm(f => ({ ...f, status: s.key }))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.chipText, form.status === s.key && styles.chipTextActive]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Conta'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Seleção de Cliente */}
      <Modal
        visible={clienteModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setClienteModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Cliente</Text>
            <TouchableOpacity
              onPress={() => setClienteModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <MaterialIcons name="close" size={24} color={palette.slate700} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearch}>
            <MaterialIcons name="search" size={20} color={palette.slate400} />
            <RNTextInput
              placeholder="Buscar cliente..."
              value={clienteSearch}
              onChangeText={setClienteSearch}
              style={styles.modalSearchInput}
              placeholderTextColor={palette.slate400}
              autoFocus
            />
            {clienteSearch.length > 0 && (
              <TouchableOpacity onPress={() => setClienteSearch('')}>
                <MaterialIcons name="close" size={18} color={palette.slate400} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={clientesFiltrados}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  form.clienteId === item.id && styles.modalItemActive,
                ]}
                onPress={() => {
                  setForm(f => ({
                    ...f,
                    clienteId: item.id,
                    clienteNome: item.nome,
                    ordem_servico_id: selectedOrdem?.clienteId === item.id ? f.ordem_servico_id : '',
                  }));
                  setClienteSearch('');
                  setClienteModalOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.modalItemIcon}>
                  <MaterialIcons name="person" size={18} color={palette.navy800} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalItemName}>{item.nome}</Text>
                  {item.telefone ? (
                    <Text style={styles.modalItemSub}>{item.telefone}</Text>
                  ) : null}
                </View>
                {form.clienteId === item.id && (
                  <MaterialIcons name="check-circle" size={20} color={palette.navy800} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              isLoading ? (
                <LoadingState message="Carregando clientes..." helper="Buscando clientes disponiveis." />
              ) : (
                <View style={styles.modalEmpty}>
                  <MaterialIcons name="person-search" size={40} color={palette.slate300} />
                  <Text style={styles.modalEmptyText}>Nenhum cliente encontrado</Text>
                </View>
              )
            )}
          />
        </View>
      </Modal>

      <CalendarDatePicker
        visible={calendarModalOpen}
        value={form.data_vencimento}
        title="Vencimento"
        onSelect={date => setForm(f => ({ ...f, data_vencimento: date }))}
        onClose={() => setCalendarModalOpen(false)}
      />

      <Modal
        visible={osModalOpen}
        animationType="slide"
        onRequestClose={() => {
          setOsModalOpen(false);
          setOsSearch('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar OS</Text>
            <TouchableOpacity
              onPress={() => {
                setOsModalOpen(false);
                setOsSearch('');
              }}
              style={styles.modalCloseBtn}
            >
              <MaterialIcons name="close" size={24} color={palette.slate700} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearch}>
            <MaterialIcons name="search" size={20} color={palette.slate400} />
            <RNTextInput
              placeholder="Buscar por OS, cliente, modelo ou placa..."
              value={osSearch}
              onChangeText={setOsSearch}
              style={styles.modalSearchInput}
              placeholderTextColor={palette.slate400}
              autoFocus
            />
            {osSearch.length > 0 && (
              <TouchableOpacity onPress={() => setOsSearch('')}>
                <MaterialIcons name="close" size={18} color={palette.slate400} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredOrdens}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
            renderItem={({ item }) => {
              const cliente = clientes.find(c => c.id === item.clienteId);
              const veiculo = veiculos.find(v => v.id === item.veiculoId);
              const isSelected = form.ordem_servico_id === String(item.id);
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemActive]}
                  onPress={() => {
                    setForm(f => ({
                      ...f,
                      ordem_servico_id: String(item.id),
                      clienteId: f.clienteId ?? item.clienteId,
                      clienteNome: f.clienteNome || cliente?.nome || '',
                      descricao: f.descricao || `OS #${String(item.id).padStart(3, '0')}`,
                      valor: f.valor || String(item.valor || ''),
                    }));
                    setOsSearch('');
                    setOsModalOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemIcon}>
                    <MaterialIcons name="engineering" size={18} color={palette.navy800} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemName}>
                      OS #{String(item.id).padStart(3, '0')} · R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.modalItemSub} numberOfLines={1}>
                      {cliente?.nome || 'Cliente nao informado'} · {veiculo ? `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})` : 'Veiculo nao informado'}
                    </Text>
                  </View>
                  {isSelected ? (
                    <MaterialIcons name="check-circle" size={20} color={palette.navy800} />
                  ) : null}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              isLoading ? (
                <LoadingState message="Carregando ordens..." helper="Buscando ordens disponiveis." />
              ) : (
                <View style={styles.modalEmpty}>
                  <MaterialIcons name="engineering" size={40} color={palette.slate300} />
                  <Text style={styles.modalEmptyText}>Nenhuma OS encontrada</Text>
                </View>
              )
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },
  keyboardView: { flex: 1, backgroundColor: palette.slate100 },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },

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

  // Tipo buttons (large)
  tipoBtn: {
    flex: 1,
    height: 64,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: palette.slate200,
    backgroundColor: palette.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tipoBtnReceber: {
    borderColor: palette.emerald600,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  tipoBtnPagar: {
    borderColor: palette.rose600,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  tipoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.slate500,
  },
  tipoBtnTextReceber: { color: palette.emerald600 },
  tipoBtnTextPagar: { color: palette.rose600 },

  // Inputs
  input: {
    marginBottom: spacing.md,
    fontSize: 14,
  },

  // Cliente Picker
  pickerBtn: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.md,
    backgroundColor: palette.slate50,
    overflow: 'hidden',
  },
  pickerBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  pickerLabel: {
    fontSize: 10,
    color: palette.slate400,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  pickerValue: {
    fontSize: 14,
    color: palette.slate900,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  clearBtnText: {
    fontSize: 12,
    color: palette.rose600,
    fontWeight: '600',
  },

  // Chips
  chipGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.slate500,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: palette.slate100,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  chipActive: {
    backgroundColor: palette.navy800,
    borderColor: palette.navy800,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.slate500,
  },
  chipTextActive: {
    color: palette.white,
    fontWeight: '700',
  },

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

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: palette.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.slate900,
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 52,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: palette.slate900,
    fontWeight: '500',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
  },
  modalItemActive: {
    borderColor: palette.navy800,
    backgroundColor: palette.navy50,
  },
  modalItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.navy50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
  modalItemSub: {
    fontSize: 12,
    color: palette.slate400,
    marginTop: 2,
    fontWeight: '500',
  },
  modalEmpty: {
    alignItems: 'center',
    marginTop: 48,
    gap: spacing.sm,
  },
  modalEmptyText: {
    fontSize: 14,
    color: palette.slate400,
    fontWeight: '600',
  },
});
