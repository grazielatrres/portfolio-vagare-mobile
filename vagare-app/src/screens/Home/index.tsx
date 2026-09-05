import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Login } from './Login';
import { SignIn } from './SignIn';
import { colors } from '@/theme';

type AuthScreen = 'login' | 'signIn';

export function Home() {
  const [screen, setScreen] = useState<AuthScreen>('login');

  return (
    <View style={styles.container}>
      {screen === 'login' ? (
        <Login onCreateAccount={() => setScreen('signIn')} />
      ) : (
        <SignIn onBack={() => setScreen('login')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
