import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { colors, spacing } from '@/theme';
import { Button } from './Button';
import { Input } from './Input';

export interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  containerStyle?: ViewStyle;
}

function formatDate(date: Date | null): string {
  if (!date) {
    return '';
  }
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function DateField({ label, value, onChange, minimumDate, containerStyle }: DateFieldProps) {
  const [visible, setVisible] = useState(false);

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setVisible(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    onChange(selectedDate);
  }

  const picker = (
    <DateTimePicker
      value={value ?? minimumDate ?? new Date()}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      minimumDate={minimumDate}
      onChange={handleChange}
      style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
    />
  );

  return (
    <View style={containerStyle}>
      <Pressable onPress={() => setVisible(true)}>
        <Input
          label={label}
          placeholder="dd/mm/aaaa"
          value={formatDate(value)}
          editable={false}
          pointerEvents="none"
          rightElement={<Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />}
        />
      </Pressable>

      {visible && Platform.OS === 'ios' ? (
        <Modal transparent animationType="fade" onRequestClose={() => setVisible(false)}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
            <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
              {picker}
              <Button
                title="Concluído"
                variant="outline"
                onPress={() => setVisible(false)}
                style={styles.doneButton}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {visible && Platform.OS !== 'ios' ? picker : null}
    </View>
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
    padding: spacing.md,
  },
  iosPicker: {
    height: 200,
  },
  doneButton: {
    marginTop: spacing.sm,
  },
});
