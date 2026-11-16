import { useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  BackButton,
  Button,
  FormError,
  FormScrollView,
  Input,
  PASSWORD_FORM_KEYBOARD_OFFSET,
  PasswordInput,
  PasswordRequirements,
  Screen,
} from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { ApiError } from "@/services/api";
import { spacing } from "@/theme";
import { passwordErrors } from "@/utils/passwordPolicy";
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
  const { errors, validate, clearError } = useFieldErrors<
    "name" | "email" | "password" | "confirmPassword"
  >();

  async function handleSubmit() {
    setError(null);

    const isValid = validate({
      ...(!name.trim() && { name: "Informe seu nome" }),
      ...(!email.trim() && { email: "Informe seu e-mail" }),
      ...passwordErrors(password, confirmPassword),
    });
    if (!isValid) {
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
    <Screen>
      <FormScrollView
        contentContainerStyle={styles.content}
        bottomOffset={PASSWORD_FORM_KEYBOARD_OFFSET}
      >
        <BackButton onPress={onBack} style={styles.backButton} />

        <AuthHeader title="Criar conta" subtitle="Crie sua conta no Vagare" />

        <View style={styles.form}>
          <Input
            label="Nome"
            placeholder="Seu nome"
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError("name");
            }}
            error={errors.name}
            autoCapitalize="words"
            containerStyle={styles.field}
          />
          <Input
            label="Email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError("email");
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.field}
          />
          <PasswordInput
            label="Senha"
            placeholder="Crie uma senha forte"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError("password");
            }}
            error={errors.password}
            containerStyle={styles.field}
          />
          <PasswordRequirements password={password} />
          <PasswordInput
            label="Confirmar senha"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              clearError("confirmPassword");
            }}
            error={errors.confirmPassword}
            containerStyle={styles.field}
          />

          <FormError message={error} />

          <Button
            title={isLoading ? "Criando conta..." : "Criar Conta"}
            onPress={handleSubmit}
            disabled={isLoading}
          />
        </View>
      </FormScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
