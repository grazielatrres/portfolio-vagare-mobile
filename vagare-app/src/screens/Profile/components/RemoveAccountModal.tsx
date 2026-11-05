import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, FormError, Input } from '@/components';
import { colors, fonts, spacing } from '@/theme';

const CONFIRMATION_PHRASE = 'queroexcluirminhaconta';

export interface RemoveAccountModalProps {
  visible: boolean;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RemoveAccountModal({
  visible,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}: RemoveAccountModalProps) {
  const [phrase, setPhrase] = useState('');
  const [wasVisible, setWasVisible] = useState(visible);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setPhrase('');
    }
  }

  const canConfirm = phrase === CONFIRMATION_PHRASE && !isDeleting;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Excluir conta</Text>
          <Text style={styles.message}>
            Esta ação é permanente: suas viagens e dados serão removidos. Para confirmar, digite{' '}
            <Text style={styles.bold}>{CONFIRMATION_PHRASE}</Text> abaixo.
          </Text>

          <Input
            label="Frase de confirmação"
            placeholder={CONFIRMATION_PHRASE}
            value={phrase}
            onChangeText={setPhrase}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.field}
          />

          <FormError message={error} style={styles.errorText} />

          <View style={styles.actions}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={onCancel}
              disabled={isDeleting}
              style={styles.cancelButton}
            />
            <Button
              title={isDeleting ? 'Excluindo...' : 'Excluir definitivamente'}
              onPress={onConfirm}
              disabled={!canConfirm}
              style={styles.confirmButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: spacing.lg,
  },
  sheet: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 16,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  bold: {
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  field: {
    marginBottom: spacing.sm,
  },
  errorText: {
    textAlign: 'left',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.danger,
  },
});
