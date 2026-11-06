import {
  countDistinctCountries,
  countTripDays,
  dayNumberInTrip,
  formatDateCompact,
  formatDateFull,
  formatDateRange,
  formatDateShort,
  formatDateWithWeekday,
  getCountryFromDestination,
  getGreeting,
} from '@/utils/format';

describe('getGreeting', () => {
  it('retorna "Bom dia" antes do meio-dia', () => {
    expect(getGreeting(new Date(2026, 0, 1, 9))).toBe('Bom dia');
  });

  it('retorna "Boa tarde" entre meio-dia e 18h', () => {
    expect(getGreeting(new Date(2026, 0, 1, 12))).toBe('Boa tarde');
    expect(getGreeting(new Date(2026, 0, 1, 17, 59))).toBe('Boa tarde');
  });

  it('retorna "Boa noite" a partir das 18h', () => {
    expect(getGreeting(new Date(2026, 0, 1, 18))).toBe('Boa noite');
    expect(getGreeting(new Date(2026, 0, 1, 23))).toBe('Boa noite');
  });
});

describe('formatDateShort', () => {
  it('formata a data no padrão "dia de mês" em pt-BR', () => {
    expect(formatDateShort('2026-09-05')).toBe('5 de set.');
  });
});

describe('formatDateCompact', () => {
  it('formata a data como "dia mês"', () => {
    expect(formatDateCompact('2026-09-05')).toBe('5 set.');
  });
});

describe('formatDateRange', () => {
  it('junta as duas datas com um travessão', () => {
    expect(formatDateRange('2026-09-01', '2026-09-10')).toBe('1 de set. – 10 de set.');
  });
});

describe('formatDateFull', () => {
  it('formata a data completa no padrão dd/mm/aaaa', () => {
    expect(formatDateFull('2026-09-05')).toBe('05/09/2026');
  });
});

describe('formatDateWithWeekday', () => {
  it('inclui o dia da semana abreviado', () => {
    expect(formatDateWithWeekday('2026-09-05')).toBe('sáb., 5 de set.');
  });
});

describe('countTripDays', () => {
  it('conta os dias da viagem incluindo o primeiro e o último dia', () => {
    expect(countTripDays('2026-09-01', '2026-09-10')).toBe(10);
  });

  it('retorna 1 quando início e fim são o mesmo dia', () => {
    expect(countTripDays('2026-09-01', '2026-09-01')).toBe(1);
  });
});

describe('dayNumberInTrip', () => {
  it('retorna 1 para o primeiro dia da viagem', () => {
    expect(dayNumberInTrip('2026-09-01', '2026-09-01')).toBe(1);
  });

  it('calcula o número do dia a partir do início da viagem', () => {
    expect(dayNumberInTrip('2026-09-01', '2026-09-03')).toBe(3);
  });
});

describe('getCountryFromDestination', () => {
  it('extrai o país após a última vírgula', () => {
    expect(getCountryFromDestination('Santorini, Grécia')).toBe('Grécia');
  });

  it('retorna o destino inteiro quando não há vírgula', () => {
    expect(getCountryFromDestination('Paris')).toBe('Paris');
  });

  it('remove espaços extras ao redor do país', () => {
    expect(getCountryFromDestination('Roma,  Itália ')).toBe('Itália');
  });
});

describe('countDistinctCountries', () => {
  it('conta países distintos ignorando repetições', () => {
    const destinations = ['Santorini, Grécia', 'Mykonos, Grécia', 'Paris, França'];
    expect(countDistinctCountries(destinations)).toBe(2);
  });

  it('ignora diferenças de maiúsculas e minúsculas', () => {
    expect(countDistinctCountries(['Santorini, Grécia', 'Mykonos, GRÉCIA'])).toBe(1);
  });

  it('retorna 0 para lista vazia', () => {
    expect(countDistinctCountries([])).toBe(0);
  });
});
