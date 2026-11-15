export type CurrencyCode = 'BRL' | 'USD' | 'EUR';

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'BRL', label: 'Real', symbol: 'R$' },
  { code: 'USD', label: 'Dólar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
];

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
};

export function digitsToAmount(digits: string): number {
  if (!digits) {
    return 0;
  }
  return Number(digits) / 100;
}

export function amountToDigits(value: number): string {
  return Math.round(value * 100).toString();
}

export function formatAmountFromDigits(digits: string, currency: CurrencyCode): string {
  return formatCurrencyValue(digitsToAmount(digits), currency);
}

// Dígitos de um input monetário mascarado. O backspace sobre o símbolo, espaço
// ou separador não remove nenhum dígito, então é tratado como apagar o último.
export function digitsFromCurrencyInput(
  text: string,
  prevDigits: string,
  currency: CurrencyCode,
): string {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '');
  const prevFormatted = prevDigits ? formatAmountFromDigits(prevDigits, currency) : '';
  if (digits === prevDigits && text.length < prevFormatted.length) {
    return prevDigits.slice(0, -1);
  }
  return digits;
}

export function formatCurrencyValue(value: string | number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: 'currency',
    currency,
  }).format(Number(value));
}
