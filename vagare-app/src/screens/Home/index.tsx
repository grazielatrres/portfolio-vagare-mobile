import { StyleSheet, View } from 'react-native';

import { Login } from './Login';
import { colors } from '@/theme';

export function Home() {
  return (
    <View style={styles.container}>
      <Login />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
