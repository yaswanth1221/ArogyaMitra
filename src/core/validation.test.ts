import { describe, expect, it } from 'vitest';
import { DEFAULT_WEIGHTS } from '../config/appConfig';
import { validateHousehold, validateText, validateWeights, type HouseholdDraft } from './validation';

const valid: HouseholdDraft = {
  village: 'Rampur Kalan', memberCategory: 'Pregnant woman', visitType: 'ANC visit',
  dueDate: '2026-11-05', priority: 'High', status: 'Pending',
};

describe('validateHousehold', () => {
  it('accepts a valid draft', () => {
    expect(validateHousehold(valid)).toEqual({});
  });

  it('rejects empty village, bad date, unknown category', () => {
    const errors = validateHousehold({ ...valid, village: '  ', dueDate: '2026-02-31', memberCategory: 'x' });
    expect(Object.keys(errors).sort()).toEqual(['dueDate', 'memberCategory', 'village']);
  });

  it('rejects markup-like village names', () => {
    expect(validateHousehold({ ...valid, village: '<script>' }).village).toBeDefined();
  });
});

describe('validateText / validateWeights', () => {
  it('enforces length limits', () => {
    expect(validateText('', 10, 'Note')).not.toBeNull();
    expect(validateText('a'.repeat(11), 10, 'Note')).not.toBeNull();
    expect(validateText('ok', 10, 'Note')).toBeNull();
  });

  it('rejects negative and non-finite weights', () => {
    expect(Object.keys(validateWeights({ ...DEFAULT_WEIGHTS, high: -1, low: Number.NaN }))).toEqual(['high', 'low']);
  });
});
