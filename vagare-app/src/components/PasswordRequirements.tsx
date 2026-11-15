import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fonts, spacing } from '@/theme';
import { PASSWORD_REQUIREMENTS } from '@/utils/passwordPolicy';

export interface PasswordRequirementsProps {
  password: string;
  style?: ViewStyle;
}

const SUCCESS_COLOR = '#2E7D32';

export function PasswordRequirements({ password, style }: PasswordRequirementsProps) {
  return (
    <View style={[styles.root, style]} accessibilityLabel="Requisitos da senha">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(password);
        const color = met ? SUCCESS_COLOR : colors.text.secondary;

        return (
          <View
            key={req.id}
            style={styles.row}
            accessibilityLabel={`${req.label}: ${met ? 'atendido' : 'pendente'}`}
            testID={`password-req-${req.id}`}
          >
            <Ionicons
              name={met ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={color}
            />
            <Text style={[styles.label, { color }]}>{req.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.regular,
  },
});
