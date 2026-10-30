import { APP_CONFIG } from '../config/appConfig';
import { MEMBER_CATEGORIES, PRIORITIES, VISIT_TYPES } from '../data/categories';
import type { Household, PriorityWeights } from '../types';
import { isValidIsoDate } from '../utils/dates';

export type Errors<T extends string> = Partial<Record<T, string>>;
export type HouseholdDraft = Pick<Household, 'village' | 'memberCategory' | 'visitType' | 'dueDate' | 'priority' | 'status'>;

const VILLAGE_PATTERN = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} '-]*$/u;

export function validateHousehold(draft: HouseholdDraft): Errors<keyof HouseholdDraft> {
  const errors: Errors<keyof HouseholdDraft> = {};
  const village = draft.village.trim();
  if (village === '') errors.village = 'Village is required.';
  else if (village.length > APP_CONFIG.limits.villageChars) errors.village = `Use at most ${APP_CONFIG.limits.villageChars} characters.`;
  else if (!VILLAGE_PATTERN.test(village)) errors.village = 'Use letters, numbers, spaces, hyphens or apostrophes only.';
  if (!(MEMBER_CATEGORIES as readonly string[]).includes(draft.memberCategory)) errors.memberCategory = 'Choose a member category.';
  if (!(VISIT_TYPES as readonly string[]).includes(draft.visitType)) errors.visitType = 'Choose a visit type.';
  if (!isValidIsoDate(draft.dueDate)) errors.dueDate = 'Enter a valid due date.';
  if (!(PRIORITIES as readonly string[]).includes(draft.priority)) errors.priority = 'Choose a priority.';
  if (draft.status !== 'Pending' && draft.status !== 'Completed') errors.status = 'Choose a status.';
  return errors;
}

export function validateText(text: string, maxChars: number, label: string): string | null {
  const trimmed = text.trim();
  if (trimmed === '') return `${label} cannot be empty.`;
  if (trimmed.length > maxChars) return `${label} must be at most ${maxChars} characters.`;
  return null;
}

export function validateWeights(w: PriorityWeights): Errors<keyof PriorityWeights> {
  const errors: Errors<keyof PriorityWeights> = {};
  (Object.keys(w) as (keyof PriorityWeights)[]).forEach((key) => {
    const value = w[key];
    if (!Number.isFinite(value) || value < 0 || value > APP_CONFIG.limits.maxWeight) {
      errors[key] = `Enter a number from 0 to ${APP_CONFIG.limits.maxWeight}.`;
    }
  });
  return errors;
}
