import { derivePeriodFromTime } from '@/utils/activityPeriod';

describe('derivePeriodFromTime', () => {
  it('classifica horários antes do meio-dia como manhã', () => {
    expect(derivePeriodFromTime('08:00')).toBe('manha');
    expect(derivePeriodFromTime('11:59')).toBe('manha');
  });

  it('classifica horários entre meio-dia e 18h como tarde', () => {
    expect(derivePeriodFromTime('12:00')).toBe('tarde');
    expect(derivePeriodFromTime('17:59')).toBe('tarde');
  });

  it('classifica horários a partir das 18h como noite', () => {
    expect(derivePeriodFromTime('18:00')).toBe('noite');
    expect(derivePeriodFromTime('23:30')).toBe('noite');
  });

  it('aceita espaços ao redor do horário', () => {
    expect(derivePeriodFromTime('  09:15  ')).toBe('manha');
  });

  it('retorna null para um horário inválido', () => {
    expect(derivePeriodFromTime('25:00')).toBeNull();
    expect(derivePeriodFromTime('não é hora')).toBeNull();
  });
});
