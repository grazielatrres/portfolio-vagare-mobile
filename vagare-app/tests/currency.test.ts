import {
  amountToDigits,
  digitsToAmount,
  formatAmountFromDigits,
  formatCurrencyValue,
} from '@/utils/currency';

describe('digitsToAmount', () => {
  it('converte dígitos em centavos para um valor decimal', () => {
    expect(digitsToAmount('1050')).toBe(10.5);
  });

  it('retorna 0 para string vazia', () => {
    expect(digitsToAmount('')).toBe(0);
  });
});

describe('amountToDigits', () => {
  it('converte um valor decimal em dígitos de centavos', () => {
    expect(amountToDigits(10.5)).toBe('1050');
  });

  it('arredonda valores com imprecisão de ponto flutuante', () => {
    expect(amountToDigits(10.555)).toBe('1056');
  });

  it('retorna "0" para valor zero', () => {
    expect(amountToDigits(0)).toBe('0');
  });
});

describe('formatCurrencyValue', () => {
  it('formata valores em reais com o símbolo R$', () => {
    const result = formatCurrencyValue(10.5, 'BRL');
    expect(result).toContain('R$');
    expect(result).toContain('10,50');
  });

  it('formata valores em dólar', () => {
    expect(formatCurrencyValue(10.5, 'USD')).toBe('$10.50');
  });

  it('formata valores em euro', () => {
    const result = formatCurrencyValue(10.5, 'EUR');
    expect(result).toContain('€');
    expect(result).toContain('10,50');
  });
});

describe('formatAmountFromDigits', () => {
  it('converte dígitos e formata como moeda em um único passo', () => {
    const result = formatAmountFromDigits('1050', 'BRL');
    expect(result).toContain('R$');
    expect(result).toContain('10,50');
  });

  it('formata string vazia como zero', () => {
    expect(formatAmountFromDigits('', 'USD')).toBe('$0.00');
  });
});
