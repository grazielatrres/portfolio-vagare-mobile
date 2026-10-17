import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button, DayField, FormError, Input } from '@/components';
import { useCreateInfoMutation } from '@/hooks/useCreateInfoMutation';
import { useUpdateInfoMutation } from '@/hooks/useUpdateInfoMutation';
import { ApiError } from '@/services/api';
import { DocumentDetails, Info } from '@/services/infos';
import { Trip } from '@/services/trips';
import { colors, fonts, spacing } from '@/theme';
import { fromISODate, toISODate } from '@/utils/date';

export interface DocumentFormProps {
  trip: Trip;
  info?: Info;
  onCancel: () => void;
  onSuccess: () => void;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function maxValidityDate(): Date {
  const date = startOfToday();
  date.setFullYear(date.getFullYear() + 20);
  return date;
}

export function DocumentForm({ trip, info, onCancel, onSuccess }: DocumentFormProps) {
  const isEditMode = !!info;
  const createMutation = useCreateInfoMutation(trip.id);
  const updateMutation = useUpdateInfoMutation(trip.id);
  const isPending = isEditMode ? updateMutation.isPending : createMutation.isPending;

  const details = (info?.details ?? {}) as Partial<DocumentDetails>;

  const [documentType, setDocumentType] = useState(info?.title ?? '');
  const [validity, setValidity] = useState<Date | null>(
    info?.date ? fromISODate(info.date) : null,
  );
  const [number, setNumber] = useState(details.number ?? '');
  const [description, setDescription] = useState(info?.description ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!documentType.trim()) {
      setError('Tipo de documento é obrigatório');
      return;
    }

    const payload = {
      type: 'document' as const,
      title: documentType.trim(),
      date: validity ? toISODate(validity) : null,
      description: description.trim() || null,
      details: {
        number: number.trim(),
      },
    };

    try {
      if (isEditMode && info) {
        await updateMutation.mutateAsync({ id: info.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEditMode
            ? 'Não foi possível salvar o documento.'
            : 'Não foi possível adicionar o documento.',
      );
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name={isEditMode ? 'create-outline' : 'add'} size={20} color={colors.text.primary} />
        <Text style={styles.title}>{isEditMode ? 'Editar documento' : 'Adicionar documento'}</Text>
      </View>

      <Input
        label="Tipo de documento"
        required
        placeholder="Ex: Passaporte, Visto, Seguro viagem"
        value={documentType}
        onChangeText={setDocumentType}
        containerStyle={styles.field}
      />

      <Input
        label="Número"
        placeholder="Ex: FZ123456"
        value={number}
        onChangeText={setNumber}
        containerStyle={styles.field}
      />

      <DayField
        label="Validade"
        value={validity}
        onChange={setValidity}
        minimumDate={startOfToday()}
        maximumDate={maxValidityDate()}
        containerStyle={styles.field}
      />

      <Input
        label="Observações"
        placeholder="Ex: Validade mínima de 6 meses"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        inputStyle={styles.multilineInput}
        containerStyle={styles.field}
      />

      <FormError message={error} />

      <View style={styles.actions}>
        <Button
          title="Cancelar"
          variant="soft"
          onPress={onCancel}
          disabled={isPending}
          style={styles.actionButton}
        />
        <Button
          title={
            isEditMode ? (isPending ? 'Salvando...' : 'Salvar') : isPending ? 'Adicionando...' : 'Adicionar'
          }
          onPress={handleSubmit}
          disabled={isPending}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.text.primary,
  },
  field: {
    marginBottom: spacing.md,
  },
  multilineInput: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
