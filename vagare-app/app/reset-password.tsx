import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ResetPassword } from '@/screens/ResetPassword';
import { colors } from '@/theme';

export default function ResetPasswordRoute() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  return (
    <View style={styles.container}>
      <ResetPassword token={token} onDone={() => router.replace('/(auth)')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
