import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, FlatList, Keyboard } from 'react-native';
import { Button, TextInput, Searchbar, SegmentedButtons } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDriveOnData } from '../../context/DriveOnDataContext';
import { useAuth } from '../../context/AuthContext';
import { palette, spacing, borderRadius, shadows } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingState from '../../components/LoadingState';
import dayjs from 'dayjs';
import { getFriendlyErrorMessage, parseMoneyValue } from '../../utils/errorMessages';

type FormItem = {
  id?: number;
  tipo: 'servico' | 'peca';
  servicoId?: number | null;
  pecaId?: number | null;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  aberta: ['em_andamento', 'cancelada'],
  em_andamento: ['concluida', 'cancelada'],
  concluida: [],
  cancelada: [],
};

const STATUS_LABELS: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export default function OSFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { osId, orcamentoId } = route.params ?? {};
  const { ordens, orcamentos, clientes, veiculos, funcionarios, servicos, pecas, createRecord, updateRecord, isLoading } = useDriveOnData();
  const { can } = useAuth();

  const isEditing = osId != null;
  const os = isEditing ? ordens.find(o => o.id === Number(osId)) : undefined;
  const orcamentoToConvert = orcamentoId ? orcamentos.find(o => o.id === Number(orcamentoId)) : undefined;

  useEffect(() => {
    if (!can('ordens', isEditing ? 'update' : 'create')) {
      navigation.goBack();
    }
  }, [can, isEditing, navigation]);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clienteId: null as number | null,
    veiculoId: null as number | null,
    funcionarioId: null as number | null,
    observacoes: '',
    status: 'aberta',
  });

  const [itens, setItens] = useState<FormItem[]>([]);

  // Selection Modals
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);

  // Search States
  const [clientSearch, setClientSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  // Item Form States
  const [itemType, setItemType] = useState<'servico' | 'peca'>('servico');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemQtd, setItemQtd] = useState('1');
  const [itemPrice, setItemPrice] = useState('0');
  const [itemError, setItemError] = useState<string | null>(null);
  const [isItemKeyboardVisible, setIsItemKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsItemKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsItemKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const closeItemModal = React.useCallback(() => {
    Keyboard.dismiss();
    setItemModalVisible(false);
    setSelectedItemId(null);
    setItemName('');
    setItemQtd('1');
    setItemPrice('0');
    setItemError(null);
  }, []);

  const handleItemModalRequestClose = React.useCallback(() => {
    if (isItemKeyboardVisible) {
      Keyboard.dismiss();
      return;
    }
    closeItemModal();
  }, [closeItemModal, isItemKeyboardVisible]);

  // Load OS if editing or converting from estimate
  useEffect(() => {
    if (isEditing && os) {
      // Find matching employee by name or ID if possible
      const matchingEmp = funcionarios.find(f => f.nome === os.mecanico);
      setForm({
        clienteId: os.clienteId,
        veiculoId: os.veiculoId,
        funcionarioId: matchingEmp?.id || null,
        observacoes: os.descricao,
        status: os.status,
      });

      if (os.itens) {
        setItens(
          os.itens.map(item => ({
            id: item.id,
            tipo: item.tipo,
            servicoId: item.servicoId,
            pecaId: item.pecaId,
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.subtotal,
          }))
        );
      }
    } else if (orcamentoToConvert) {
      setForm({
        clienteId: orcamentoToConvert.clienteId,
        veiculoId: orcamentoToConvert.veiculoId,
        funcionarioId: null,
        observacoes: orcamentoToConvert.descricao || `Conversão do Orçamento #${orcamentoToConvert.id}`,
        status: 'aberta',
      });

      if (orcamentoToConvert.itens) {
        setItens(
          orcamentoToConvert.itens.map(item => ({
            tipo: item.tipo,
            servicoId: item.servicoId,
            pecaId: item.pecaId,
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.subtotal,
          }))
        );
      }
    }
  }, [isEditing, os, orcamentoToConvert, funcionarios]);

  const selectedCliente = clientes.find(c => c.id === form.clienteId);
  const selectedVeiculo = veiculos.find(v => v.id === form.veiculoId);
  const selectedFuncionario = funcionarios.find(f => f.id === form.funcionarioId);

  const totalGeral = itens.reduce((sum, i) => sum + i.subtotal, 0);

  const handleSave = async () => {
    if (!form.clienteId) {
      Alert.alert('Atenção', 'Selecione um cliente.');
      return;
    }
    if (!form.veiculoId) {
      Alert.alert('Atenção', 'Selecione um veículo.');
      return;
    }
    if (!form.funcionarioId) {
      Alert.alert('Atenção', 'Selecione um mecânico/funcionário.');
      return;
    }
    if (itens.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um item à ordem de serviço.');
      return;
    }
    if (totalGeral <= 0) {
      Alert.alert('Valor obrigatório', 'O total da OS precisa ser maior que R$ 0,00. Revise os itens antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cliente_id: form.clienteId,
        veiculo_id: form.veiculoId,
        funcionario_id: form.funcionarioId,
        observacoes: form.observacoes.trim(),
        status: form.status,
        valor_total: totalGeral,
        itens: itens.map(i => ({
          tipo_item: i.tipo,
          servico_id: i.tipo === 'servico' ? i.servicoId : null,
          peca_id: i.tipo === 'peca' ? i.pecaId : null,
          nome: i.nome,
          quantidade: i.quantidade,
          preco_unitario: i.precoUnitario,
          subtotal: i.subtotal,
        })),
      };

      let newOS: any = null;
      if (isEditing && os) {
        await updateRecord('/ordens', os.id, payload);
      } else {
        newOS = await createRecord('/ordens', payload);
      }

      if (!isEditing && orcamentoId && newOS && newOS.id) {
        navigation.replace('OSDetalhes', { osId: newOS.id });
      } else {
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Não foi possível salvar', getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    setItemError(null);
    if (!selectedItemId) {
      setItemError('Selecione um serviço ou peça da lista.');
      return;
    }
    const qty = parseInt(itemQtd, 10);
    const price = parseMoneyValue(itemPrice);

    if (!Number.isFinite(qty) || qty <= 0) {
      setItemError('Informe uma quantidade maior que zero.');
      return;
    }
    if (price <= 0) {
      setItemError('Informe um preço maior que R$ 0,00 para o item.');
      return;
    }

    // Validate Stock if Piece
    if (itemType === 'peca') {
      const targetPeca = pecas.find(p => p.id === selectedItemId);
      if (targetPeca && targetPeca.estoque < qty) {
        Alert.alert(
          'Estoque Insuficiente',
          `A quantidade desejada (${qty}) é maior do que a disponível em estoque (${targetPeca.estoque}).`
        );
        return;
      }
    }

    const newItem: FormItem = {
      tipo: itemType,
      servicoId: itemType === 'servico' ? selectedItemId : null,
      pecaId: itemType === 'peca' ? selectedItemId : null,
      nome: itemName,
      quantidade: qty,
      precoUnitario: price,
      subtotal: qty * price,
    };

    setItens(curr => [...curr, newItem]);
    closeItemModal();
  };

  const handleRemoveItem = (index: number) => {
    setItens(curr => curr.filter((_, idx) => idx !== index));
  };

  // Filters
  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.cpf.replace(/\D/g, '').includes(clientSearch)
  );

  const selectedClienteVeiculos = veiculos.filter(v => String(v.clienteId) === String(form.clienteId));
  const filteredVeiculos = selectedClienteVeiculos.filter(v =>
    (v.marca.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
     v.modelo.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
     v.placa.toLowerCase().includes(vehicleSearch.toLowerCase()))
  );
  const canCreateVehicle = can('veiculos', 'create');
  const selectedClientHasNoVehicles = !!form.clienteId && selectedClienteVeiculos.length === 0;

  const handleCreateVehicleForSelectedClient = () => {
    if (!form.clienteId) return;
    setVehicleModalVisible(false);
    setVehicleSearch('');
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
        : { ...curr, veiculoId: onlyVehicle.id }
    ));
  }, [form.clienteId, form.veiculoId, selectedClienteVeiculos]);

  const filteredFuncionarios = funcionarios.filter(f =>
    f.nome.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const filteredItems = itemType === 'servico'
    ? servicos.filter(s => s.nome.toLowerCase().includes(itemSearch.toLowerCase()))
    : pecas.filter(p => p.nome.toLowerCase().includes(itemSearch.toLowerCase()));

  // Allowed transitions
  const statusOptions = isEditing && os
    ? [os.status, ...(VALID_TRANSITIONS[os.status] ?? [])]
    : ['aberta'];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={isEditing ? 'Editar OS' : 'Nova OS'}
        subtitle={isEditing ? 'Atualize as informações da OS' : 'Abra uma nova Ordem de Serviço'}
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
          {/* Card 1: Associação de Cliente/Veículo/Mecânico */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person-outline" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Associações</Text>
            </View>

            {/* Selector Cliente */}
            <TouchableOpacity
              style={styles.selectorField}
              activeOpacity={0.7}
              onPress={() => setClientModalVisible(true)}
            >
              <View style={styles.selectorContent}>
                <Text style={styles.selectorLabel}>Cliente *</Text>
                <Text style={[styles.selectorValue, !form.clienteId && styles.selectorPlaceholder]}>
                  {selectedCliente ? selectedCliente.nome : 'Toque para escolher o cliente'}
                </Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color={palette.slate400} />
            </TouchableOpacity>

            {/* Selector Veículo */}
            <TouchableOpacity
              style={[
                styles.selectorField,
                { marginTop: spacing.md },
                (!form.clienteId || selectedClientHasNoVehicles) && styles.selectorDisabled,
              ]}
              activeOpacity={0.7}
              disabled={!form.clienteId || selectedClientHasNoVehicles}
              onPress={() => setVehicleModalVisible(true)}
            >
              <View style={styles.selectorContent}>
                <Text style={styles.selectorLabel}>Veículo *</Text>
                <Text style={[styles.selectorValue, !form.veiculoId && styles.selectorPlaceholder]}>
                  {selectedVeiculo
                    ? `${selectedVeiculo.marca} ${selectedVeiculo.modelo} (${selectedVeiculo.placa})`
                    : selectedClientHasNoVehicles
                      ? 'Nenhum veículo cadastrado'
                      : form.clienteId ? 'Toque para escolher o veículo' : 'Selecione primeiro um cliente'}
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
                    Cadastre o veículo agora para continuar preenchendo a OS.
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

            {/* Selector Funcionário */}
            <TouchableOpacity
              style={[styles.selectorField, { marginTop: spacing.md }]}
              activeOpacity={0.7}
              onPress={() => setEmployeeModalVisible(true)}
            >
              <View style={styles.selectorContent}>
                <Text style={styles.selectorLabel}>Mecânico / Funcionário *</Text>
                <Text style={[styles.selectorValue, !form.funcionarioId && styles.selectorPlaceholder]}>
                  {selectedFuncionario ? selectedFuncionario.nome : 'Toque para escolher o mecânico'}
                </Text>
              </View>
              <MaterialIcons name="arrow-drop-down" size={24} color={palette.slate400} />
            </TouchableOpacity>
          </View>

          {/* Card 2: Dados Gerais */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="info-outline" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Dados do Serviço</Text>
            </View>

            <TextInput
              label="Observações / Descrição do problema *"
              value={form.observacoes}
              onChangeText={val => setForm(curr => ({ ...curr, observacoes: val }))}
              mode="outlined"
              multiline={true}
              numberOfLines={3}
              style={styles.input}
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="note-text-outline" color={palette.slate400} />}
            />

            {/* Status Selector (só se editando) */}
            {isEditing && (
              <>
                <Text style={styles.groupLabel}>Status Atual / Transições Permitidas</Text>
                <SegmentedButtons
                  value={form.status}
                  onValueChange={val => setForm(curr => ({ ...curr, status: val }))}
                  buttons={statusOptions.map(st => ({
                    value: st,
                    label: STATUS_LABELS[st] || st,
                  }))}
                  theme={{
                    colors: {
                      primary: palette.navy800,
                      secondaryContainer: palette.navy50,
                      onSecondaryContainer: palette.navy800,
                      outline: palette.slate200,
                    },
                  }}
                  style={{ marginTop: spacing.xs }}
                />
              </>
            )}
          </View>

          {/* Card 3: Serviços e Peças */}
          <View style={styles.card}>
            <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <MaterialIcons name="build" size={20} color={palette.navy800} />
                <Text style={styles.cardTitle}>Itens e Serviços</Text>
              </View>
              <TouchableOpacity
                style={styles.addItemBtn}
                onPress={() => setItemModalVisible(true)}
              >
                <MaterialIcons name="add" size={20} color={palette.white} />
                <Text style={styles.addItemBtnText}>Item</Text>
              </TouchableOpacity>
            </View>

            {itens.length === 0 ? (
              <Text style={styles.emptyItensText}>Nenhum item vinculado à OS.</Text>
            ) : (
              <View style={styles.itensList}>
                {itens.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemBadgeIcon}>
                      <MaterialCommunityIcons
                        name={(item.tipo === 'servico' ? 'wrench-outline' : 'nut-outline') as any}
                        size={18}
                        color={palette.navy700}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemNome}>{item.nome}</Text>
                      <Text style={styles.itemMeta}>
                        Qtd: {item.quantidade} · Un: R$ {item.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginRight: spacing.sm }}>
                      <Text style={styles.itemSubtotal}>
                        R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                      <MaterialIcons name="delete-outline" size={20} color={palette.rose600} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Totalizador */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Geral</Text>
              <Text style={styles.totalValue}>
                R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Botão Principal */}
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
            {isEditing ? 'Salvar OS' : 'Criar Ordem de Serviço'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── MODAL SELEÇÃO CLIENTE ── */}
      <Modal visible={clientModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <ScreenHeader title="Selecionar Cliente" showBack={false} />
          <Searchbar
            placeholder="Buscar por nome ou CPF..."
            onChangeText={setClientSearch}
            value={clientSearch}
            style={styles.searchBar}
          />
          <FlatList
            data={filteredClientes}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalListItem}
                onPress={() => {
                  setForm(curr => ({ ...curr, clienteId: item.id, veiculoId: null }));
                  setClientModalVisible(false);
                  setClientSearch('');
                }}
              >
                <Text style={styles.modalListItemName}>{item.nome}</Text>
                <Text style={styles.modalListItemMeta}>{item.cpf ? `CPF: ${item.cpf}` : 'Sem CPF'}</Text>
              </TouchableOpacity>
            )}
          />
          <Button mode="outlined" style={styles.modalCloseBtn} onPress={() => { setClientModalVisible(false); setClientSearch(''); }}>
            Fechar
          </Button>
        </View>
      </Modal>

      {/* ── MODAL SELEÇÃO VEÍCULO ── */}
      <Modal visible={vehicleModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <ScreenHeader title={`Veículos de ${selectedCliente?.nome ?? 'Cliente'}`} showBack={false} />
          <Searchbar
            placeholder="Buscar por marca, modelo ou placa..."
            onChangeText={setVehicleSearch}
            value={vehicleSearch}
            style={styles.searchBar}
          />
          <FlatList
            data={filteredVeiculos}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.modalList}
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
                    <Text style={styles.modalCreateVehicleSubtitle}>Já vinculado a {selectedCliente?.nome ?? 'este cliente'}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
                </TouchableOpacity>
              ) : null
            )}
            ListEmptyComponent={() => (
              isLoading ? (
                <LoadingState message="Carregando veiculos..." helper="Buscando os veiculos do cliente." />
              ) : (
                <View style={styles.modalEmptyState}>
                <View style={styles.modalEmptyIcon}>
                  <MaterialIcons name="directions-car" size={28} color={palette.navy800} />
                </View>
                <Text style={styles.modalEmptyTitle}>
                  {selectedClienteVeiculos.length === 0
                    ? 'Este cliente ainda não tem veículo'
                    : 'Nenhum veículo encontrado'}
                </Text>
                <Text style={styles.modalEmptyText}>
                  {selectedClienteVeiculos.length === 0
                    ? 'Cadastre o veículo deste cliente para continuar criando a OS.'
                    : 'Revise a busca ou cadastre um novo veículo para este cliente.'}
                </Text>
                {canCreateVehicle ? (
                  <TouchableOpacity
                    style={styles.modalEmptyButton}
                    activeOpacity={0.8}
                    onPress={handleCreateVehicleForSelectedClient}
                  >
                    <MaterialIcons name="add" size={18} color={palette.white} />
                    <Text style={styles.modalEmptyButtonText}>Cadastrar Veículo</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.modalEmptyPermissionText}>
                    Seu perfil nao permite cadastrar veiculos.
                  </Text>
                )}
                </View>
              )
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalListItem}
                onPress={() => {
                  setForm(curr => ({ ...curr, veiculoId: item.id }));
                  setVehicleModalVisible(false);
                  setVehicleSearch('');
                }}
              >
                <Text style={styles.modalListItemName}>{item.marca} {item.modelo}</Text>
                <Text style={styles.modalListItemMeta}>Placa: {item.placa} · Cor: {item.cor}</Text>
              </TouchableOpacity>
            )}
          />
          <Button mode="outlined" style={styles.modalCloseBtn} onPress={() => { setVehicleModalVisible(false); setVehicleSearch(''); }}>
            Fechar
          </Button>
        </View>
      </Modal>

      {/* ── MODAL SELEÇÃO FUNCIONÁRIO ── */}
      <Modal visible={employeeModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <ScreenHeader title="Selecionar Mecânico" showBack={false} />
          <Searchbar
            placeholder="Buscar por nome..."
            onChangeText={setEmployeeSearch}
            value={employeeSearch}
            style={styles.searchBar}
          />
          <FlatList
            data={filteredFuncionarios}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalListItem}
                onPress={() => {
                  setForm(curr => ({ ...curr, funcionarioId: item.id }));
                  setEmployeeModalVisible(false);
                  setEmployeeSearch('');
                }}
              >
                <Text style={styles.modalListItemName}>{item.nome}</Text>
                <Text style={styles.modalListItemMeta}>Cargo: {item.cargo}</Text>
              </TouchableOpacity>
            )}
          />
          <Button mode="outlined" style={styles.modalCloseBtn} onPress={() => { setEmployeeModalVisible(false); setEmployeeSearch(''); }}>
            Fechar
          </Button>
        </View>
      </Modal>

      {/* ── MODAL ADICIONAR ITEM ── */}
      <Modal
        visible={itemModalVisible}
        animationType="slide"
        onRequestClose={handleItemModalRequestClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <ScreenHeader title="Adicionar Item" showBack={false} />

          {itemError ? (
            <View style={[styles.itemErrorBox, styles.itemTopErrorBox]}>
              <MaterialIcons name="error-outline" size={18} color={palette.rose600} />
              <Text style={styles.itemErrorText}>{itemError}</Text>
            </View>
          ) : null}

          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            <SegmentedButtons
              value={itemType}
              onValueChange={val => {
                setItemType(val as any);
                setSelectedItemId(null);
                setItemName('');
                setItemPrice('0');
                setItemError(null);
              }}
              buttons={[
                { value: 'servico', label: 'Serviço' },
                { value: 'peca', label: 'Peça/Produto' },
              ]}
              theme={{
                colors: {
                  primary: palette.navy800,
                  secondaryContainer: palette.navy50,
                  onSecondaryContainer: palette.navy800,
                  outline: palette.slate200,
                },
              }}
            />
          </View>

          <Searchbar
            placeholder={itemType === 'servico' ? 'Buscar serviço...' : 'Buscar peça...'}
            onChangeText={setItemSearch}
            value={itemSearch}
            style={[styles.searchBar, { marginTop: spacing.md }]}
          />

          <FlatList
            data={filteredItems as any[]}
            keyExtractor={item => String(item.id)}
            style={styles.itemModalList}
            contentContainerStyle={styles.modalList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            renderItem={({ item }) => {
              const isSel = selectedItemId === item.id;
              const price = itemType === 'servico' ? (item as any).valor : (item as any).precoVenda;
              return (
                <TouchableOpacity
                  style={[styles.modalListItem, isSel && styles.modalListItemSelected]}
                  onPress={() => {
                    setSelectedItemId(item.id);
                    setItemName(item.nome);
                    setItemPrice(String(price));
                    setItemError(null);
                  }}
                >
                  <Text style={styles.modalListItemName}>{item.nome}</Text>
                  <Text style={styles.modalListItemMeta}>
                    {itemType === 'servico'
                      ? `Valor: R$ ${price.toFixed(2)}`
                      : `Estoque: ${(item as any).estoque} · R$ ${price.toFixed(2)}`}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.itemFormContainer}>
            <Text style={styles.selectedItemLabel}>
              {selectedItemId ? `Selecionado: ${itemName}` : 'Nenhum item selecionado'}
            </Text>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Quantidade"
                  value={itemQtd}
                  onChangeText={(value) => {
                    setItemQtd(value);
                    setItemError(null);
                  }}
                  keyboardType="numeric"
                  mode="outlined"
                  activeOutlineColor={palette.navy800}
                  onFocus={() => setIsItemKeyboardVisible(true)}
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <TextInput
                  label="Preço Unitário"
                  value={itemPrice}
                  onChangeText={(value) => {
                    setItemPrice(value);
                    setItemError(null);
                  }}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  activeOutlineColor={palette.navy800}
                  onFocus={() => setIsItemKeyboardVisible(true)}
                />
              </View>
            </View>

            <Button
              mode="contained"
              style={{ marginTop: spacing.md }}
              buttonColor={palette.navy800}
              onPress={handleAddItem}
            >
              Adicionar à OS
            </Button>
            <Button
              mode="outlined"
              style={{ marginTop: spacing.sm, borderColor: palette.slate300 }}
              textColor={palette.slate500}
              onPress={closeItemModal}
            >
              Cancelar
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.slate400,
    marginTop: spacing.md,
    textTransform: 'uppercase',
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

  // Selectors
  selectorField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.slate50,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  selectorDisabled: {
    backgroundColor: palette.slate100,
    borderColor: palette.slate200,
    opacity: 0.6,
  },
  selectorContent: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 11,
    color: palette.slate400,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 14,
    color: palette.slate900,
    fontWeight: '700',
  },
  selectorPlaceholder: {
    color: palette.slate400,
    fontWeight: '500',
  },
  vehicleInlineEmpty: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: palette.navy50,
    borderWidth: 1,
    borderColor: palette.navy100,
  },
  vehicleInlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
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
    fontSize: 13,
    lineHeight: 18,
    color: palette.slate500,
    marginTop: 2,
  },
  vehicleInlineButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: palette.navy800,
    marginTop: spacing.sm,
  },
  vehicleInlineButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.white,
  },
  vehicleInlinePermissionText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.slate500,
    marginTop: spacing.sm,
  },

  // Item List & Add Button
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.navy800,
    borderRadius: borderRadius.md,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  addItemBtnText: {
    fontSize: 13,
    color: palette.white,
    fontWeight: '700',
  },
  emptyItensText: {
    fontSize: 13,
    color: palette.slate400,
    textAlign: 'center',
    marginVertical: spacing.lg,
    fontWeight: '500',
  },
  itensList: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate100,
  },
  itemBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: palette.navy50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  itemNome: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.slate900,
  },
  itemMeta: {
    fontSize: 11,
    color: palette.slate400,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.slate900,
  },

  // Totalizer Box
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.navy50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.navy800,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.navy800,
  },

  // Modal styling
  modalContainer: {
    flex: 1,
    backgroundColor: palette.slate100,
  },
  searchBar: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    backgroundColor: palette.white,
  },
  modalList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  itemModalList: {
    flex: 1,
  },
  modalListItem: {
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
  },
  modalListItemSelected: {
    borderColor: palette.navy800,
    borderWidth: 2,
    backgroundColor: palette.navy50,
  },
  modalListItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.slate900,
  },
  modalListItemMeta: {
    fontSize: 12,
    color: palette.slate400,
    marginTop: 2,
  },
  modalEmptyState: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
  },
  modalEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: palette.navy50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalEmptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.slate900,
    textAlign: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    color: palette.slate500,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  modalEmptyButton: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: palette.navy800,
  },
  modalEmptyButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.white,
  },
  modalEmptyPermissionText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.slate500,
    textAlign: 'center',
  },
  modalCloseBtn: {
    margin: spacing.lg,
    borderColor: palette.slate300,
  },
  itemFormContainer: {
    backgroundColor: palette.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.slate200,
    ...shadows.lg,
  },
  selectedItemLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.navy800,
    marginBottom: spacing.md,
  },
  itemErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.18)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  itemTopErrorBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: 0,
  },
  itemErrorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: palette.rose600,
    lineHeight: 18,
  },
});
