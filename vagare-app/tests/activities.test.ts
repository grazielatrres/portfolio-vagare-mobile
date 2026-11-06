import { groupByDay, tripDayDates } from '@/utils/activities';
import { buildActivity } from './helpers/fixtures';

describe('groupByDay', () => {
  it('agrupa atividades pelo dia e ordena os grupos cronologicamente', () => {
    const activities = [
      buildActivity({ id: 'a2', date: '2026-09-03T00:00:00.000Z' }),
      buildActivity({ id: 'a1', date: '2026-09-02T00:00:00.000Z' }),
      buildActivity({ id: 'a3', date: '2026-09-02T18:00:00.000Z' }),
    ];

    const groups = groupByDay(activities, '2026-09-01');

    expect(groups.map((group) => group.date)).toEqual(['2026-09-02', '2026-09-03']);
    expect(groups[0].activities.map((activity) => activity.id)).toEqual(['a1', 'a3']);
    expect(groups[0].dayNumber).toBe(2);
    expect(groups[1].dayNumber).toBe(3);
  });

  it('retorna lista vazia quando não há atividades', () => {
    expect(groupByDay([], '2026-09-01')).toEqual([]);
  });
});

describe('tripDayDates', () => {
  it('lista todas as datas entre início e fim, inclusive', () => {
    expect(tripDayDates('2026-09-01', '2026-09-03')).toEqual([
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
    ]);
  });

  it('retorna uma única data quando início e fim coincidem', () => {
    expect(tripDayDates('2026-09-01', '2026-09-01')).toEqual(['2026-09-01']);
  });
});
