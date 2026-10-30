import { describe, expect, it } from 'vitest';
import { DEMO_VILLAGES, LEGACY_DEMO_VILLAGES } from './categories';
import { generateDemoHouseholds, updateLegacyDemoVillages } from './demoHouseholds';

describe('generateDemoHouseholds', () => {
  it('creates 500 unique synthetic records by default', () => {
    const list = generateDemoHouseholds('2026-10-30');
    expect(list).toHaveLength(500);
    expect(new Set(list.map((h) => h.id)).size).toBe(500);
    expect(list.every((h) => h.isDemo)).toBe(true);
  });

  it('is deterministic for the same inputs', () => {
    expect(generateDemoHouseholds('2026-10-30', 20)).toEqual(generateDemoHouseholds('2026-10-30', 20));
  });

  it('uses Andhra Pradesh place names for generated demo villages', () => {
    const list = generateDemoHouseholds('2026-10-30');
    expect(list.every((household) => (DEMO_VILLAGES as readonly string[]).includes(household.village))).toBe(true);
    expect(DEMO_VILLAGES).not.toEqual(LEGACY_DEMO_VILLAGES);
  });

  it('updates legacy demo villages without changing user records or other household data', () => {
    const [demo, userRecord] = generateDemoHouseholds('2026-10-30', 2);
    const existingDemo = { ...demo, village: LEGACY_DEMO_VILLAGES[0], priority: 'High' as const };
    const customRecord = { ...userRecord, isDemo: false, village: LEGACY_DEMO_VILLAGES[1] };

    const updated = updateLegacyDemoVillages([existingDemo, customRecord], '2026-10-30');

    expect((DEMO_VILLAGES as readonly string[]).includes(updated[0].village)).toBe(true);
    expect(updated[0].priority).toBe('High');
    expect(updated[1]).toEqual(customRecord);
  });
});
