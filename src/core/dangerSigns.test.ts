import { describe, expect, it } from 'vitest';
import { checkDangerSigns } from './dangerSigns';

describe('checkDangerSigns', () => {
  it('flags third-trimester bleeding written in Hinglish', () => {
    const { matched } = checkDangerSigns('Teesre trimester me bleeding ho rahi hai.');
    expect(matched.map((r) => r.id)).toContain('PREG-BLEEDING');
  });

  it('does not fire on an unrelated question', () => {
    expect(checkDangerSigns('ORS kaise banana hai?').matched).toHaveLength(0);
  });

  it('requires every group: bleeding alone is not a pregnancy rule hit', () => {
    const ids = checkDangerSigns('nose bleeding after a fall').matched.map((r) => r.id);
    expect(ids).not.toContain('PREG-BLEEDING');
  });

  it('errs towards referral on negation (documented limitation)', () => {
    const ids = checkDangerSigns('no bleeding in pregnancy').matched.map((r) => r.id);
    expect(ids).toContain('PREG-BLEEDING');
  });

  it('does not match short terms inside longer words', () => {
    expect(checkDangerSigns('doctors said fine').matched).toHaveLength(0);
  });

  it('reports a non-negative execution time', () => {
    expect(checkDangerSigns('').elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
