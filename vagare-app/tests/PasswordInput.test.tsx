import { fireEvent, render, screen } from '@testing-library/react-native';

import { PasswordInput } from '@/components/PasswordInput';

describe('PasswordInput', () => {
  it('esconde o texto digitado por padrão', () => {
    render(<PasswordInput label="Senha" placeholder="Sua senha" />);

    expect(screen.getByPlaceholderText('Sua senha').props.secureTextEntry).toBe(true);
  });

  it('alterna a visibilidade da senha ao tocar no ícone', () => {
    render(<PasswordInput label="Senha" placeholder="Sua senha" />);

    const toggle = screen.UNSAFE_getByType(
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- acessa o Pressable nativo para simular o toque no ícone
      require('react-native').Pressable,
    );

    fireEvent.press(toggle);
    expect(screen.getByPlaceholderText('Sua senha').props.secureTextEntry).toBe(false);

    fireEvent.press(toggle);
    expect(screen.getByPlaceholderText('Sua senha').props.secureTextEntry).toBe(true);
  });
});
