import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { Authenticated } from '@/screens/Authenticated';
import { Home } from '@/screens/Home';
import { colors } from '@/theme';

export default function Index() {
  const { user, isRestoring } = useAuth();

  return (
    <View style={styles.container}>{!isRestoring && (user ? <Authenticated /> : <Home />)}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
