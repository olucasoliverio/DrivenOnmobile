import React from 'react';
import { KeyboardTypeOptions, ScrollView, StyleSheet, View, Text } from 'react-native';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { palette, spacing, borderRadius } from '../theme/theme';

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
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={() => !isSaving && onCancel()} style={styles.dialog}>
        {/* Custom Header with icon circle to match the web design */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialIcons name={getHeaderIcon(title)} size={22} color={palette.navy800} />
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* ScrollArea container for scrollable inputs */}
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
            {fields.map((field) => (
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
            ))}
          </ScrollView>
        </Dialog.ScrollArea>

        {/* Action buttons styled to match the web interface */}
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
  actions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelBtn: {
    borderRadius: borderRadius.full,
    borderColor: palette.navy800,
    borderWidth: 1.5,
  },
  saveBtn: {
    borderRadius: borderRadius.full,
    minWidth: 100,
  },
  btnLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
});
