import { fireEvent, render, screen } from '@testing-library/react-native';

import { CurrencyPicker } from '@/components/CurrencyPicker';

describe('CurrencyPicker', () => {
  it('troca a moeda ao tocar em outra opção', async () => {
    const onChange = jest.fn();
    await render(<CurrencyPicker value="BRL" onChange={onChange} />);

    await fireEvent.press(screen.getByText('$ USD'));

    expect(onChange).toHaveBeenCalledWith('USD');
  });

  it('não troca a moeda quando está desabilitado e mostra a explicação', async () => {
    const onChange = jest.fn();
    await render(
      <CurrencyPicker
        value="BRL"
        onChange={onChange}
        disabled
        hint="A moeda não pode ser alterada depois que a viagem é criada."
      />,
    );

    await fireEvent.press(screen.getByText('$ USD'));

    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByText('A moeda não pode ser alterada depois que a viagem é criada.'),
    ).toBeTruthy();
  });
});
