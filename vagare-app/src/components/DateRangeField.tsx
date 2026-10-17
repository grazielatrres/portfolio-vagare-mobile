import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, CalendarProps, DateData, LocaleConfig } from 'react-native-calendars';

import { calendarTheme, colors, spacing } from '@/theme';
import { fromISODate, toISODate } from '@/utils/date';
import { Button } from './Button';
import { Input } from './Input';

type MarkedDates = NonNullable<CalendarProps['markedDates']>;

LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

export interface DateRangeFieldProps {
  label: string;
  required?: boolean;
  startDate: Date | null;
  endDate: Date | null;
  onChange: (startDate: Date, endDate: Date) => void;
  minimumDate?: Date;
  containerStyle?: ViewStyle;
}

function formatRange(startDate: Date | null, endDate: Date | null): string {
  if (!startDate || !endDate) {
    return '';
  }
  const formatter = new Intl.DateTimeFormat('pt-BR');
  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}

function buildMarkedDates(start: string | null, end: string | null): MarkedDates {
  if (!start) {
    return {};
  }

  if (!end || end === start) {
    return {
      [start]: { startingDay: true, endingDay: true, color: colors.accent, textColor: colors.surface },
    };
  }

  const marks: MarkedDates = {};
  let cursor = fromISODate(start);
  const endDateObj = fromISODate(end);

  while (cursor.getTime() <= endDateObj.getTime()) {
    const dateString = toISODate(cursor);
    marks[dateString] = { color: colors.accentSoft, textColor: colors.text.primary };
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }

  marks[start] = { startingDay: true, color: colors.accent, textColor: colors.surface };
  marks[end] = { endingDay: true, color: colors.accent, textColor: colors.surface };

  return marks;
}

export function DateRangeField({
  label,
  required,
  startDate,
  endDate,
  onChange,
  minimumDate,
  containerStyle,
}: DateRangeFieldProps) {
  const [visible, setVisible] = useState(false);
  const [tempStart, setTempStart] = useState<string | null>(null);
  const [tempEnd, setTempEnd] = useState<string | null>(null);

  function open() {
    setTempStart(startDate ? toISODate(startDate) : null);
    setTempEnd(endDate ? toISODate(endDate) : null);
    setVisible(true);
  }

  function handleDayPress(day: DateData) {
    if (!tempStart || tempEnd) {
      setTempStart(day.dateString);
      setTempEnd(null);
      return;
    }

    if (day.dateString < tempStart) {
      setTempStart(day.dateString);
      setTempEnd(null);
      return;
    }

    setTempEnd(day.dateString);
  }

  function handleConfirm() {
    if (!tempStart) {
      return;
    }
    onChange(fromISODate(tempStart), fromISODate(tempEnd ?? tempStart));
    setVisible(false);
  }

  const markedDates = useMemo(() => buildMarkedDates(tempStart, tempEnd), [tempStart, tempEnd]);

  return (
    <View style={containerStyle}>
      <Pressable onPress={open}>
        <Input
          label={label}
          required={required}
          placeholder="Selecione o período"
          value={formatRange(startDate, endDate)}
          editable={false}
          pointerEvents="none"
          rightElement={<Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />}
        />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Calendar
              markingType="period"
              markedDates={markedDates}
              onDayPress={handleDayPress}
              minDate={minimumDate ? toISODate(minimumDate) : undefined}
              theme={calendarTheme}
            />
            <Button
              title="Confirmar"
              onPress={handleConfirm}
              disabled={!tempStart}
              style={styles.confirmButton}
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
  confirmButton: {
    marginTop: spacing.sm,
  },
});
