import { formatTime, fromISODate, maskTimeInput, toISODate } from '@/utils/date';

describe('toISODate', () => {
  it('formata uma data local como YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 8, 5))).toBe('2026-09-05');
  });

  it('preenche mês e dia com zero à esquerda', () => {
    expect(toISODate(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
});

describe('fromISODate', () => {
  it('converte uma string ISO em data local', () => {
    const date = fromISODate('2026-09-05');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(5);
  });

  it('ignora a parte de horário quando presente', () => {
    const date = fromISODate('2026-09-05T10:00:00.000Z');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(5);
  });
});

describe('formatTime', () => {
  it('extrai o horário no formato HH:mm', () => {
    expect(formatTime('14:30:00')).toBe('14:30');
  });

  it('retorna o valor original quando não há horário reconhecível', () => {
    expect(formatTime('sem horário')).toBe('sem horário');
  });
});

describe('maskTimeInput', () => {
  it('mantém até dois dígitos sem separador', () => {
    expect(maskTimeInput('14')).toBe('14');
  });

  it('insere os dois pontos após o segundo dígito', () => {
    expect(maskTimeInput('1430')).toBe('14:30');
  });

  it('remove caracteres não numéricos', () => {
    expect(maskTimeInput('ab14cd30ef')).toBe('14:30');
  });

  it('ignora dígitos além do quarto', () => {
    expect(maskTimeInput('143099')).toBe('14:30');
  });
});
