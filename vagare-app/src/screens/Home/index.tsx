import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';
import { ForgotPassword } from './ForgotPassword';
import { Login } from './Login';
import { SignIn } from './SignIn';

type AuthScreen = 'login' | 'signIn' | 'forgotPassword';

export function Home() {
  const [screen, setScreen] = useState<AuthScreen>('login');

  return (
    <View style={styles.container}>
      {screen === 'login' && (
        <Login
          onCreateAccount={() => setScreen('signIn')}
          onForgotPassword={() => setScreen('forgotPassword')}
        />
      )}
      {screen === 'signIn' && <SignIn onBack={() => setScreen('login')} />}
      {screen === 'forgotPassword' && <ForgotPassword onBack={() => setScreen('login')} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
