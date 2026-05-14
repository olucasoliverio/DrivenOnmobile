import React from 'react';
import { KeyboardTypeOptions } from 'react-native';
import { Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { palette, spacing } from '../theme/theme';

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
      <Dialog visible={visible} onDismiss={() => !isSaving && onCancel()}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          {fields.map((field) => (
            <TextInput
              key={field.key}
              label={field.label}
              value={values[field.key] ?? ''}
              onChangeText={(value) => onChange(field.key, value)}
              mode="outlined"
              style={{ marginBottom: spacing.sm, backgroundColor: palette.white }}
              keyboardType={field.keyboardType}
              multiline={field.multiline}
              autoCapitalize={field.autoCapitalize}
            />
          ))}
        </Dialog.Content>
        <Dialog.Actions>
          <Button disabled={isSaving} onPress={onCancel}>Cancelar</Button>
          <Button loading={isSaving} disabled={isSaving} onPress={onSave}>Salvar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
