import { StyleSheet, View } from 'react-native';

import { Home } from '@/screens/Home';
import { colors } from '@/theme';

export default function Index() {
  return (
    <View style={styles.container}>
      <Home />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
