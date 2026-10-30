import type { Household, PriorityWeights } from '../types';
import { daysBetween } from '../utils/dates';

export type Bucket = 1 | 2 | 3 | 4;

export const BUCKET_LABELS: Record<Bucket, string> = {
  1: 'Overdue high-risk visits',
  2: 'High-priority visits due today',
  3: 'Other visits due today or overdue',
  4: 'Upcoming visits',
};

export interface ScorePart {
  label: string;
  points: number;
}

export interface PlannedVisit {
  household: Household;
  bucket: Bucket;
  /** Days past due (0 if not overdue). */
  overdueDays: number;
  score: number;
  parts: ScorePart[];
}

export function overdueDays(h: Household, today: string): number {
  return Math.max(0, daysBetween(h.dueDate, today));
}

/** Bucket order is fixed by the brief; the weighted score only orders visits inside a bucket. */
export function bucketOf(h: Household, today: string): Bucket {
  const late = overdueDays(h, today) > 0;
  const dueToday = h.dueDate === today;
  if (late && h.priority === 'High') return 1;
  if (dueToday && h.priority === 'High') return 2;
  if (late || dueToday) return 3;
  return 4;
}

export function scoreParts(h: Household, today: string, w: PriorityWeights): ScorePart[] {
  const late = overdueDays(h, today);
  const priorityPoints = { High: w.high, Medium: w.medium, Low: w.low }[h.priority];
  return [
    { label: `Overdue ${late} day(s) x ${w.overduePerDay} (cap ${w.overdueCap})`, points: Math.min(late * w.overduePerDay, w.overdueCap) },
    { label: `${h.priority} priority`, points: priorityPoints },
    { label: 'Due today', points: h.dueDate === today ? w.dueToday : 0 },
  ];
}

export function planVisits(households: Household[], today: string, w: PriorityWeights): PlannedVisit[] {
  return households
    .filter((h) => h.status === 'Pending')
    .map((household) => {
      const parts = scoreParts(household, today, w);
      return {
        household,
        bucket: bucketOf(household, today),
        overdueDays: overdueDays(household, today),
        score: parts.reduce((sum, p) => sum + p.points, 0),
        parts,
      };
    })
    .sort(
      (a, b) =>
        a.bucket - b.bucket ||
        b.score - a.score ||
        a.household.dueDate.localeCompare(b.household.dueDate) ||
        a.household.id.localeCompare(b.household.id),
    );
}
