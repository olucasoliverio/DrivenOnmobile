import React, { useState } from 'react';
import { KeyboardTypeOptions, ScrollView, StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { palette, spacing, borderRadius, shadows } from '../theme/theme';
import { useDriveOnData } from '../context/DriveOnDataContext';

export type CrudField = {
  key: string;
  label: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

type CrudDialogProps = {
  visible: boolean;
  title: string;
  fields: CrudField[];
  values: Record<string, string>;
  isSaving?: boolean;
  onChange: (key: string, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

function getFieldIcon(key: string): string {
  const k = key.toLowerCase();
  if (k.includes('email')) return 'email-outline';
  if (k.includes('telefone') || k.includes('phone') || k.includes('celular') || k.includes('fone')) return 'phone-outline';
  if (k.includes('cpf') || k.includes('cnpj') || k.includes('documento')) return 'card-account-details-outline';
  if (k.includes('observaca') || k.includes('observacao') || k.includes('obs') || k.includes('descri') || k.includes('descricao')) return 'note-text-outline';
  if (k.includes('marca') || k.includes('modelo') || k.includes('placa') || k.includes('cor') || k.includes('veiculo')) return 'car-outline';
  if (k.includes('data') || k.includes('ano') || k.includes('vencimento') || k.includes('inicio') || k.includes('fim')) return 'calendar-outline';
  if (k.includes('valor') || k.includes('preco') || k.includes('custo') || k.includes('venda') || k.includes('unit')) return 'currency-usd';
  if (k.includes('qtd') || k.includes('quant') || k.includes('quantidade')) return 'numeric';
  if (k.includes('servico') || k.includes('titulo')) return 'wrench-outline';
  if (k.includes('metodo') || k.includes('pagamento')) return 'credit-card-outline';
  if (k.includes('status') || k.includes('tipo')) return 'check-decagram-outline';
  if (k.includes('cliente') || k.includes('user') || k.includes('usuario') || k.includes('mecanico') || k.includes('nome')) return 'account-outline';
  return 'information-outline';
}

function getHeaderIcon(title: string): keyof typeof MaterialIcons.glyphMap {
  const t = title.toLowerCase();
  if (t.includes('cliente')) return 'person';
  if (t.includes('veiculo') || t.includes('carro')) return 'directions-car';
  if (t.includes('agenda') || t.includes('agendamento')) return 'event';
  if (t.includes('item') || t.includes('estoque')) return 'inventory';
  if (t.includes('fornecedor')) return 'store';
  if (t.includes('orcamento')) return 'description';
  if (t.includes('pagamento')) return 'attach-money';
  if (t.includes('servico')) return 'build';
  if (t.includes('usuario')) return 'people';
  if (t.includes('ordem') || t.includes('os')) return 'engineering';
  return 'info';
}

function isSelectField(key: string): boolean {
  const k = key.toLowerCase();
  return k === 'cliente_id' || k === 'clienteid' || k === 'veiculo_id' || k === 'veiculoid' || k === 'funcionario_id';
}

function getSelectedLabel(
  key: string,
  value: string,
  clientes: any[],
  veiculos: any[],
  usuarios: any[]
): string {
  if (!value) return 'Toque para selecionar...';
  
  const id = Number(value);
  const k = key.toLowerCase();

  if (k === 'cliente_id' || k === 'clienteid') {
    const item = clientes.find(c => c.id === id);
    return item ? item.nome : `Cliente #${id}`;
  }

  if (k === 'veiculo_id' || k === 'veiculoid') {
    const item = veiculos.find(v => v.id === id);
    return item ? `${item.marca} ${item.modelo} (${item.placa})` : `Veículo #${id}`;
  }

  if (k === 'funcionario_id') {
    const item = usuarios.find(u => u.id === id);
    return item ? item.nome : `Funcionário #${id}`;
  }

  return value;
}

export default function CrudDialog({
  visible,
  title,
  fields,
  values,
  isSaving,
  onChange,
  onCancel,
  onSave,
}: CrudDialogProps) {
  const { clientes, veiculos, usuarios } = useDriveOnData();
  const [activePickerKey, setActivePickerKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getFilteredOptions = () => {
    const q = searchQuery.toLowerCase();
    if (!activePickerKey) return [];
    const k = activePickerKey.toLowerCase();

    if (k.includes('cliente')) {
      return clientes
        .map(c => ({
          id: c.id,
          title: c.nome,
          subtitle: c.cpf ? `CPF: ${c.cpf}` : c.telefone ? `Tel: ${c.telefone}` : '',
        }))
        .filter(item => 
          item.title.toLowerCase().includes(q) || 
          item.subtitle.toLowerCase().includes(q)
        );
    }

    if (k.includes('veiculo')) {
      // Se já tiver cliente selecionado, filtrar prioritariamente os veículos desse cliente
      const selectedClientId = values['cliente_id'] || values['clienteId'];
      let list = veiculos;
      if (selectedClientId) {
        list = veiculos.filter(v => v.clienteId === Number(selectedClientId));
      }
      
      return list
        .map(v => {
          const owner = clientes.find(c => c.id === v.clienteId);
          return {
            id: v.id,
            title: `${v.marca} ${v.modelo} (${v.placa})`,
            subtitle: owner ? `Proprietário: ${owner.nome}` : '',
          };
        })
        .filter(item => 
          item.title.toLowerCase().includes(q) || 
          item.subtitle.toLowerCase().includes(q)
        );
    }

    if (k.includes('funcionario') || k.includes('mecanico')) {
      return usuarios
        .map(u => ({
          id: u.id,
          title: u.nome,
          subtitle: u.perfil ? `Perfil: ${u.perfil}` : '',
        }))
        .filter(item => 
          item.title.toLowerCase().includes(q) || 
          item.subtitle.toLowerCase().includes(q)
        );
    }

    return [];
  };

  const getPickerTitle = () => {
    if (!activePickerKey) return '';
    const k = activePickerKey.toLowerCase();
    if (k.includes('cliente')) return 'Selecionar Cliente';
    if (k.includes('veiculo')) return 'Selecionar Veículo';
    return 'Selecionar Funcionário';
  };

  return (
    <>
      <Portal>
        <Dialog visible={visible} onDismiss={() => !isSaving && onCancel()} style={styles.dialog}>
          {/* Custom Header with icon circle */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialIcons name={getHeaderIcon(title)} size={22} color={palette.navy800} />
            </View>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>

          {/* ScrollArea container for scrollable inputs */}
          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
              {fields.map((field) => {
                if (isSelectField(field.key)) {
                  return (
                    <TouchableOpacity
                      key={field.key}
                      onPress={() => {
                        setActivePickerKey(field.key);
                        setSearchQuery('');
                      }}
                      activeOpacity={0.7}
                      style={styles.selectWrapper}
                    >
                      <View pointerEvents="none">
                        <TextInput
                          label={field.label}
                          value={getSelectedLabel(field.key, values[field.key], clientes, veiculos, usuarios)}
                          mode="outlined"
                          style={styles.input}
                          activeOutlineColor={palette.navy800}
                          outlineColor={palette.slate200}
                          outlineStyle={{ borderRadius: borderRadius.md }}
                          theme={{ colors: { background: palette.slate50 } }}
                          left={<TextInput.Icon icon={getFieldIcon(field.key)} color={palette.slate400} />}
                          right={<TextInput.Icon icon="chevron-down" color={palette.slate400} />}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TextInput
                    key={field.key}
                    label={field.label}
                    value={values[field.key] ?? ''}
                    onChangeText={(value) => onChange(field.key, value)}
                    mode="outlined"
                    style={styles.input}
                    keyboardType={field.keyboardType}
                    multiline={field.multiline}
                    numberOfLines={field.multiline ? 3 : 1}
                    autoCapitalize={field.autoCapitalize}
                    activeOutlineColor={palette.navy800}
                    outlineColor={palette.slate200}
                    outlineStyle={{ borderRadius: borderRadius.md }}
                    theme={{ colors: { background: palette.slate50 } }}
                    left={<TextInput.Icon icon={getFieldIcon(field.key)} color={palette.slate400} />}
                  />
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>

          {/* Action buttons */}
          <Dialog.Actions style={styles.actions}>
            <Button
              mode="outlined"
              disabled={isSaving}
              onPress={onCancel}
              style={styles.cancelBtn}
              textColor={palette.navy800}
              labelStyle={styles.btnLabel}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              loading={isSaving}
              disabled={isSaving}
              onPress={onSave}
              style={styles.saveBtn}
              buttonColor={palette.navy800}
              textColor={palette.white}
              labelStyle={styles.btnLabel}
            >
              Salvar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Sub-dialog Picker de Busca */}
      {activePickerKey && (
        <Portal>
          <Dialog visible={true} onDismiss={() => setActivePickerKey(null)} style={styles.pickerDialog}>
            <Dialog.Title style={styles.pickerTitle}>{getPickerTitle()}</Dialog.Title>
            
            <View style={styles.pickerSearchContainer}>
              <TextInput
                placeholder="Digitar para buscar..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                mode="outlined"
                activeOutlineColor={palette.navy800}
                outlineColor={palette.slate200}
                outlineStyle={{ borderRadius: borderRadius.md }}
                style={styles.pickerSearchInput}
                left={<TextInput.Icon icon="magnify" color={palette.slate400} />}
                right={searchQuery.length > 0 ? (
                  <TextInput.Icon icon="close" color={palette.slate400} onPress={() => setSearchQuery('')} />
                ) : undefined}
              />
            </View>

            <Dialog.ScrollArea style={styles.pickerScrollArea}>
              <FlatList
                data={getFilteredOptions()}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.pickerListContent}
                style={styles.pickerFlatList}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={() => (
                  <View style={styles.pickerEmpty}>
                    <Text style={styles.pickerEmptyText}>Nenhum registro encontrado</Text>
                  </View>
                )}
                renderItem={({ item }) => {
                  const isSelected = String(item.id) === values[activePickerKey];
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        onChange(activePickerKey, String(item.id));
                        setActivePickerKey(null);
                      }}
                      style={[
                        styles.pickerItem,
                        isSelected && styles.pickerItemActive
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pickerItemContent}>
                        <Text style={[
                          styles.pickerItemText,
                          isSelected && styles.pickerItemTextActive
                        ]}>
                          {item.title}
                        </Text>
                        {item.subtitle ? (
                          <Text style={styles.pickerItemSub}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={20} color={palette.navy800} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </Dialog.ScrollArea>

            <Dialog.Actions style={styles.pickerActions}>
              <Button onPress={() => setActivePickerKey(null)} textColor={palette.navy800}>
                Voltar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.navy50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.slate900,
    flex: 1,
  },
  scrollArea: {
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.slate100,
  },
  scrollView: {
    maxHeight: 340,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
    fontSize: 14,
  },
  selectWrapper: {
    position: 'relative',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelBtn: {
    borderRadius: borderRadius.full,
    borderColor: palette.slate200,
    borderWidth: 1,
  },
  saveBtn: {
    borderRadius: borderRadius.full,
    minWidth: 100,
  },
  btnLabel: {
    fontWeight: '700',
    fontSize: 14,
  },

  // Estilos para o Dialog Picker
  pickerDialog: {
    backgroundColor: palette.white,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.slate900,
    textAlign: 'center',
    paddingTop: spacing.md,
  },
  pickerSearchContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pickerSearchInput: {
    fontSize: 14,
    height: 48,
  },
  pickerScrollArea: {
    paddingHorizontal: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.slate100,
  },
  pickerFlatList: {
    maxHeight: 280,
  },
  pickerListContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF2',
  },
  pickerItemActive: {
    backgroundColor: '#F8FAFC',
  },
  pickerItemContent: {
    flex: 1,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.slate900,
  },
  pickerItemTextActive: {
    color: palette.navy800,
    fontWeight: '700',
  },
  pickerItemSub: {
    fontSize: 11,
    color: palette.slate500,
    marginTop: 2,
  },
  pickerEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  pickerEmptyText: {
    color: palette.slate400,
    fontSize: 13,
  },
  pickerActions: {
    paddingHorizontal: spacing.md,
  },
});
