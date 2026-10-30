import { describe, expect, it } from 'vitest';
import { DEFAULT_WEIGHTS } from '../config/appConfig';
import type { Household } from '../types';
import { bucketOf, planVisits } from './priority';

const TODAY = '2026-10-30';
const make = (id: string, dueDate: string, priority: Household['priority'], status: Household['status'] = 'Pending'): Household => ({
  id, village: 'Sundarpur', memberCategory: 'Pregnant woman', visitType: 'ANC visit', dueDate, priority, status, isDemo: true,
});

describe('planVisits', () => {
  const list = [
    make('upcoming', '2026-11-02', 'High'),
    make('today-low', TODAY, 'Low'),
    make('today-high', TODAY, 'High'),
    make('overdue-high', '2026-10-25', 'High'),
    make('done', '2026-10-20', 'High', 'Completed'),
  ];

  it('orders: overdue high-risk, high due today, other due today, upcoming', () => {
    expect(planVisits(list, TODAY, DEFAULT_WEIGHTS).map((p) => p.household.id)).toEqual([
      'overdue-high', 'today-high', 'today-low', 'upcoming',
    ]);
  });

  it('excludes completed visits', () => {
    expect(planVisits(list, TODAY, DEFAULT_WEIGHTS).some((p) => p.household.id === 'done')).toBe(false);
  });

  it('orders inside a bucket by editable score (more overdue days first)', () => {
    const plan = planVisits([make('a', '2026-10-28', 'High'), make('b', '2026-10-20', 'High')], TODAY, DEFAULT_WEIGHTS);
    expect(plan.map((p) => p.household.id)).toEqual(['b', 'a']);
  });

  it('caps the overdue contribution', () => {
    const [visit] = planVisits([make('old', '2026-01-01', 'Low')], TODAY, DEFAULT_WEIGHTS);
    expect(visit.score).toBe(DEFAULT_WEIGHTS.overdueCap);
  });

  it('changing weights changes the score breakdown', () => {
    const [visit] = planVisits([make('x', TODAY, 'High')], TODAY, { ...DEFAULT_WEIGHTS, high: 99 });
    expect(visit.score).toBe(99 + DEFAULT_WEIGHTS.dueToday);
  });

  it('treats overdue non-high visits as bucket 3', () => {
    expect(bucketOf(make('m', '2026-10-29', 'Medium'), TODAY)).toBe(3);
  });
});
