import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';

import { calendarTheme, colors, spacing } from '@/theme';
import { fromISODate, toISODate } from '@/utils/date';
import { Input } from './Input';

export interface DayFieldProps {
  label: string;
  required?: boolean;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate: Date;
  maximumDate: Date;
  containerStyle?: ViewStyle;
}

function formatDay(date: Date | null): string {
  if (!date) {
    return '';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function DayField({
  label,
  required,
  value,
  onChange,
  minimumDate,
  maximumDate,
  containerStyle,
}: DayFieldProps) {
  const [visible, setVisible] = useState(false);

  function handleDayPress(day: DateData) {
    onChange(fromISODate(day.dateString));
    setVisible(false);
  }

  const markedDates = value
    ? {
        [toISODate(value)]: {
          selected: true,
          selectedColor: colors.accent,
          selectedTextColor: colors.surface,
        },
      }
    : {};

  return (
    <View style={containerStyle}>
      <Pressable onPress={() => setVisible(true)}>
        <Input
          label={label}
          required={required}
          placeholder="Selecione o dia"
          value={formatDay(value)}
          editable={false}
          pointerEvents="none"
          rightElement={<Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />}
        />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Calendar
              current={toISODate(value ?? minimumDate)}
              minDate={toISODate(minimumDate)}
              maxDate={toISODate(maximumDate)}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              theme={calendarTheme}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
});
