import { APP_CONFIG } from '../config/appConfig';
import { addDays } from '../utils/dates';
import type { Household, Priority } from '../types';
import { DEMO_VILLAGES, LEGACY_DEMO_VILLAGES, MEMBER_CATEGORIES, VISITS_BY_CATEGORY } from './categories';

/** Small deterministic PRNG so the demo data is identical on every device. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)];
}

export function formatHouseholdId(n: number): string {
  return `HH-${String(n).padStart(4, '0')}`;
}

/** Generates synthetic households with due dates spread around `today`. No real people. */
export function generateDemoHouseholds(
  today: string,
  count: number = APP_CONFIG.demoHouseholdCount,
  seed: number = APP_CONFIG.demoSeed,
): Household[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i): Household => {
    const memberCategory = pick(MEMBER_CATEGORIES, rand);
    const highChance = memberCategory === 'Pregnant woman' || memberCategory.startsWith('Newborn') ? 0.4 : 0.15;
    const r = rand();
    const priority: Priority = r < highChance ? 'High' : r < highChance + 0.3 ? 'Medium' : 'Low';
    const when = rand();
    const offset = when < 0.2 ? -(1 + Math.floor(rand() * 20)) : when < 0.35 ? 0 : 1 + Math.floor(rand() * 21);
    const dueDate = addDays(today, offset);
    const alreadyDone = offset < 0 && rand() < 0.4;
    return {
      id: formatHouseholdId(i + 1),
      village: pick(DEMO_VILLAGES, rand),
      memberCategory,
      visitType: pick(VISITS_BY_CATEGORY[memberCategory], rand),
      dueDate,
      priority,
      status: alreadyDone ? 'Completed' : 'Pending',
      completedAt: alreadyDone ? dueDate : undefined,
      isDemo: true,
    };
  });
}

/** Replaces legacy placeholder villages on synthetic rows without changing user data. */
export function updateLegacyDemoVillages(households: Household[], today: string): Household[] {
  const legacyVillages = new Set<string>(LEGACY_DEMO_VILLAGES);
  const replacements = new Map(
    generateDemoHouseholds(today).map((household) => [household.id, household.village]),
  );
  return households.map((household) => {
    const village = replacements.get(household.id);
    return household.isDemo && legacyVillages.has(household.village) && village
      ? { ...household, village }
      : household;
  });
}
