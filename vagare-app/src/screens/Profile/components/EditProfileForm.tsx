import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Divider, FormError, Input } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useUpdateProfileMutation } from '@/hooks/useUpdateProfileMutation';
import { ApiError } from '@/services/api';
import { colors, fonts, spacing } from '@/theme';
import { RemoveAccountModal } from './RemoveAccountModal';

const EMAIL_LOCKED_HINT = 'O e-mail não pode ser alterado.';

export interface EditProfileFormProps {
  name: string;
  email: string;
  onCancel: () => void;
  onSaved: () => void;
}

export function EditProfileForm({ name, email, onCancel, onSaved }: EditProfileFormProps) {
  const { updateUser, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const updateProfileMutation = useUpdateProfileMutation();

  const [nameValue, setNameValue] = useState(name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);

  function handleNameChange(text: string) {
    setNameValue(text);
    if (nameError) {
      setNameError(null);
    }
  }

  async function handleSave() {
    const trimmedName = nameValue.trim();

    if (!trimmedName) {
      setNameError('Nome é obrigatório');
      return;
    }

    if (trimmedName === name) {
      onSaved();
      return;
    }

    setFormError(null);

    try {
      await updateProfileMutation.mutateAsync({ name: trimmedName });
      await updateUser({ name: trimmedName });
      onSaved();
      showToast({ title: 'Dados atualizados', message: 'Seu perfil foi salvo.' });
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Não foi possível salvar seus dados. Tente novamente.',
      );
    }
  }

  async function handleConfirmDelete() {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteAccount();
      showToast({ title: 'Conta excluída', message: 'Sua conta foi removida.' });
    } catch (err) {
      setIsDeleting(false);
      setDeleteError(
        err instanceof ApiError ? err.message : 'Não foi possível excluir sua conta. Tente novamente.',
      );
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Editar dados</Text>

      <Input
        label="Nome completo"
        placeholder="Seu nome"
        value={nameValue}
        onChangeText={handleNameChange}
        autoCapitalize="words"
        error={nameError}
        containerStyle={styles.field}
        inputStyle={styles.roundedInput}
      />

      <Input
        label="Email"
        value={email}
        editable={false}
        accessibilityHint={EMAIL_LOCKED_HINT}
        containerStyle={styles.field}
        inputStyle={styles.roundedDisabledInput}
      />
      <Text style={styles.emailHint}>{EMAIL_LOCKED_HINT}</Text>

      <FormError message={formError} style={styles.formError} />

      <View style={styles.actions}>
        <Button
          title="Cancelar"
          variant="outline"
          onPress={onCancel}
          disabled={updateProfileMutation.isPending}
          style={styles.actionButton}
        />
        <Button
          title={updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
          onPress={handleSave}
          disabled={updateProfileMutation.isPending}
          icon={
            updateProfileMutation.isPending ? (
              <ActivityIndicator color={colors.surface} />
            ) : undefined
          }
          style={styles.actionButton}
        />
      </View>

      <Divider />

      <Pressable
        onPress={() => setIsDeleteDialogVisible(true)}
        onHoverIn={() => setIsHoveringDelete(true)}
        onHoverOut={() => setIsHoveringDelete(false)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Excluir conta"
        style={[styles.deleteButton, isHoveringDelete && styles.deleteButtonHovered]}
      >
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
        <Text style={styles.deleteButtonText}>Excluir conta</Text>
      </Pressable>

      <RemoveAccountModal
        visible={isDeleteDialogVisible}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: 19,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  roundedInput: {
    borderRadius: 26,
  },
  roundedDisabledInput: {
    borderRadius: 26,
    backgroundColor: colors.background,
    color: colors.text.secondary,
  },
  emailHint: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    fontSize: 16,
    fontFamily: fonts.serif.regular,
    color: colors.text.secondary,
  },
  formError: {
    marginBottom: spacing.sm,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
    marginTop: spacing.lg,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  deleteButtonHovered: {
    backgroundColor: colors.dangerSoft,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: fonts.serif.semiBold,
    color: colors.danger,
  },
});
