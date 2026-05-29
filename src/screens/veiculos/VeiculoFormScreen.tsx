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
import { palette, spacing, borderRadius, shadows } from '../../theme/theme';
import ScreenHeader from '../../components/ScreenHeader';

export default function VeiculoFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { veiculoId } = route.params ?? {};
  const { veiculos, clientes, createRecord, updateRecord } = useDriveOnData();

  const isEditing = veiculoId != null;
  const veiculo = isEditing ? veiculos.find(v => v.id === Number(veiculoId)) : undefined;

  const [saving, setSaving] = useState(false);
  const [clienteModalVisible, setClienteModalVisible] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [form, setForm] = useState({
    clienteId: null as number | null,
    clienteNome: '',
    marca: '',
    modelo: '',
    placa: '',
    ano: '',
    cor: '',
    combustivel: '',
    km: '',
  });

  useEffect(() => {
    if (isEditing && veiculo) {
      const cliente = clientes.find(c => c.id === veiculo.clienteId);
      setForm({
        clienteId: veiculo.clienteId,
        clienteNome: cliente?.nome ?? '',
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        placa: veiculo.placa,
        ano: String(veiculo.ano || ''),
        cor: veiculo.cor || '',
        combustivel: veiculo.combustivel || '',
        km: String(veiculo.km || ''),
      });
    }
  }, [isEditing, veiculo?.id, clientes]);

  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.clienteId || !form.marca.trim() || !form.modelo.trim() || !form.placa.trim()) {
      Alert.alert('Campos obrigatórios', 'Informe cliente, marca, modelo e placa.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        cliente_id: form.clienteId,
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        placa: form.placa.trim().toUpperCase(),
        ano: form.ano ? Number(form.ano) : null,
        cor: form.cor.trim() || null,
        combustivel: form.combustivel.trim() || null,
        km: form.km ? Number(form.km) : 0,
      };
      if (isEditing) {
        await updateRecord('/veiculos', Number(veiculoId), payload);
      } else {
        await createRecord('/veiculos', payload);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'Não foi possível salvar',
        error?.response?.data?.error ?? error?.message ?? 'Tente novamente.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={isEditing ? 'Editar Veículo' : 'Novo Veículo'}
        subtitle={isEditing ? 'Atualize as informações do veículo' : 'Cadastre um novo veículo'}
        showBack={true}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Card: Proprietário */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person-outline" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Proprietário</Text>
            </View>
            <TouchableOpacity
              style={[styles.pickerField, !!form.clienteId && styles.pickerFieldFilled]}
              onPress={() => setClienteModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.pickerIcon}>
                <MaterialIcons name="person" size={18} color={form.clienteId ? palette.navy800 : palette.slate400} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerLabel}>Cliente *</Text>
                <Text style={[styles.pickerValue, !form.clienteNome && styles.pickerPlaceholder]}>
                  {form.clienteNome || 'Selecionar cliente...'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={palette.slate400} />
            </TouchableOpacity>
          </View>

          {/* Card: Dados do Veículo */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="directions-car" size={20} color={palette.navy800} />
              <Text style={styles.cardTitle}>Dados do Veículo</Text>
            </View>

            <TextInput
              label="Marca *"
              value={form.marca}
              onChangeText={val => setForm(f => ({ ...f, marca: val }))}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="car-info" color={palette.slate400} />}
            />

            <TextInput
              label="Modelo *"
              value={form.modelo}
              onChangeText={val => setForm(f => ({ ...f, modelo: val }))}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="car" color={palette.slate400} />}
            />

            <TextInput
              label="Placa *"
              value={form.placa}
              onChangeText={val => setForm(f => ({ ...f, placa: val.toUpperCase() }))}
              mode="outlined"
              style={styles.input}
              autoCapitalize="characters"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="card-text-outline" color={palette.slate400} />}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Ano"
                  value={form.ano}
                  onChangeText={val => setForm(f => ({ ...f, ano: val }))}
                  mode="outlined"
                  style={styles.rowInput}
                  keyboardType="number-pad"
                  activeOutlineColor={palette.navy800}
                  outlineColor={palette.slate200}
                  outlineStyle={{ borderRadius: borderRadius.md }}
                  theme={{ colors: { background: palette.slate50 } }}
                  left={<TextInput.Icon icon="calendar" color={palette.slate400} />}
                  maxLength={4}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Cor"
                  value={form.cor}
                  onChangeText={val => setForm(f => ({ ...f, cor: val }))}
                  mode="outlined"
                  style={styles.rowInput}
                  autoCapitalize="words"
                  activeOutlineColor={palette.navy800}
                  outlineColor={palette.slate200}
                  outlineStyle={{ borderRadius: borderRadius.md }}
                  theme={{ colors: { background: palette.slate50 } }}
                  left={<TextInput.Icon icon="palette-outline" color={palette.slate400} />}
                />
              </View>
            </View>

            <TextInput
              label="Combustivel"
              value={form.combustivel}
              onChangeText={val => setForm(f => ({ ...f, combustivel: val }))}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="gas-station-outline" color={palette.slate400} />}
            />

            <TextInput
              label="Quilometragem (KM)"
              value={form.km}
              onChangeText={val => setForm(f => ({ ...f, km: val }))}
              mode="outlined"
              style={styles.inputLast}
              keyboardType="number-pad"
              activeOutlineColor={palette.navy800}
              outlineColor={palette.slate200}
              outlineStyle={{ borderRadius: borderRadius.md }}
              theme={{ colors: { background: palette.slate50 } }}
              left={<TextInput.Icon icon="gauge" color={palette.slate400} />}
            />
          </View>

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
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Veículo'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal: Selecionar Cliente */}
      <Modal
        visible={clienteModalVisible}
        animationType="slide"
        onRequestClose={() => setClienteModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: palette.slate100 }}>
          <ScreenHeader
            title="Selecionar Cliente"
            showBack={false}
            rightElement={
              <TouchableOpacity
                onPress={() => { setClienteModalVisible(false); setClienteSearch(''); }}
                style={{ paddingHorizontal: spacing.md }}
              >
                <MaterialIcons name="close" size={24} color={palette.white} />
              </TouchableOpacity>
            }
          />
          <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={palette.slate400} />
              <RNTextInput
                placeholder="Buscar cliente..."
                value={clienteSearch}
                onChangeText={setClienteSearch}
                style={styles.searchInput}
                placeholderTextColor={palette.slate400}
                autoFocus
              />
            </View>
          </View>
          <FlatList
            data={filteredClientes}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.xs }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listItem, form.clienteId === item.id && styles.listItemSelected]}
                onPress={() => {
                  setForm(f => ({ ...f, clienteId: item.id, clienteNome: item.nome }));
                  setClienteModalVisible(false);
                  setClienteSearch('');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.nome.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemTitle}>{item.nome}</Text>
                  {item.telefone ? <Text style={styles.listItemSub}>{item.telefone}</Text> : null}
                </View>
                {form.clienteId === item.id && (
                  <MaterialIcons name="check-circle" size={20} color={palette.navy800} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate100 },
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
  cardTitle: { fontSize: 14, fontWeight: '800', color: palette.slate900, letterSpacing: -0.2 },
  input: { marginBottom: spacing.md, fontSize: 14 },
  inputLast: { fontSize: 14 },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  rowInput: { fontSize: 14 },
  saveButton: { borderRadius: borderRadius.md, marginTop: spacing.md, ...shadows.sm },
  saveBtnLabel: { fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: borderRadius.md,
    backgroundColor: palette.slate50,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  pickerFieldFilled: {
    borderColor: palette.navy800,
    backgroundColor: 'rgba(30, 58, 138, 0.03)',
  },
  pickerIcon: { width: 32, alignItems: 'center' },
  pickerLabel: { fontSize: 11, color: palette.slate400, fontWeight: '600', marginBottom: 2 },
  pickerValue: { fontSize: 14, color: palette.slate900, fontWeight: '500' },
  pickerPlaceholder: { color: palette.slate400 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.slate200,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: palette.slate900 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
    ...shadows.sm,
  },
  listItemSelected: {
    borderColor: palette.navy800,
    backgroundColor: 'rgba(30, 58, 138, 0.04)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.navy800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: palette.white, fontWeight: '800', fontSize: 16 },
  listItemTitle: { fontSize: 14, fontWeight: '700', color: palette.slate900 },
  listItemSub: { fontSize: 12, color: palette.slate500, marginTop: 2 },
});
