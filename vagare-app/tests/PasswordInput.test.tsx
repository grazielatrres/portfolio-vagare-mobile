import { fireEvent, render, screen } from '@testing-library/react-native';

import { PasswordInput } from '@/components/PasswordInput';

describe('PasswordInput', () => {
  it('esconde o texto digitado por padrão', async () => {
    await render(<PasswordInput label="Senha" placeholder="Sua senha" />);

    expect(screen.getByPlaceholderText('Sua senha').props.secureTextEntry).toBe(true);
  });

  it('alterna a visibilidade da senha ao tocar no ícone', async () => {
    await render(<PasswordInput label="Senha" placeholder="Sua senha" />);

    await fireEvent.press(screen.getByLabelText('Mostrar senha'));
    expect(screen.getByPlaceholderText('Sua senha').props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByLabelText('Esconder senha'));
    expect(screen.getByPlaceholderText('Sua senha').props.secureTextEntry).toBe(true);
  });
});
