import { useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  BackButton,
  Button,
  FormError,
  Input,
  PasswordInput,
  PasswordRequirements,
  Screen,
} from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/api";
import { colors, spacing } from "@/theme";
import { isStrongPassword } from "@/utils/passwordPolicy";
import { AuthHeader } from "../components/AuthHeader";

export interface SignInProps {
  onBack?: () => void;
}

export function SignIn({ onBack }: SignInProps) {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!name || !email || !password || !confirmPassword) {
      setError("Preencha todos os campos para continuar.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError("A senha não atende a todos os requisitos de segurança.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      await register(name, email, password);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível criar a conta. Tente novamente.",
      );
    }
  }

  return (
    <Screen style={styles.root}>
      <BackButton onPress={onBack} style={styles.backButton} />

      <AuthHeader title="Criar conta" subtitle="Crie sua conta no Vagare" />

      <View style={styles.form}>
        <Input
          label="Nome"
          placeholder="Seu nome"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          containerStyle={styles.field}
        />
        <Input
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.field}
        />
        <PasswordInput
          label="Senha"
          placeholder="Crie uma senha forte"
          value={password}
          onChangeText={setPassword}
          containerStyle={styles.field}
        />
        <PasswordRequirements password={password} />
        <PasswordInput
          label="Confirmar senha"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          containerStyle={styles.field}
        />

        <FormError message={error} />

        <Button
          title={isLoading ? "Criando conta..." : "Criar Conta"}
          onPress={handleSubmit}
          disabled={isLoading}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.xl,
  },
  form: {
    alignSelf: "stretch",
    width: "100%",
  },
  field: {
    marginBottom: spacing.md,
  },
});
