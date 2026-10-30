import { describe, expect, it } from 'vitest';
import { respond } from './assistant';
import { SAFETY_CASES } from './safetyCases';
import { searchProtocols } from './retrieval';
import { PROTOCOL_SECTIONS } from '../data/protocols';

describe('respond', () => {
  it('answers ORS preparation from the cited section', () => {
    const result = respond('ORS kaise banana hai?');
    expect(result.category).toBe('ANSWER');
    expect(result.sources[0].section).toContain('Preparing ORS solution');
    expect(result.details.length).toBeGreaterThan(0);
  });

  it('refuses dose questions and cites the scope section', () => {
    const result = respond('Antibiotic ki dose kitni dun?');
    expect(result.category).toBe('REFUSE');
    expect(result.sources[0].section).toContain('does not cover');
  });

  it('refers now for bleeding in the third trimester', () => {
    const result = respond('Teesre trimester me bleeding ho rahi hai.');
    expect(result.category).toBe('REFER_NOW');
    expect(result.matchedRules.map((r) => r.id)).toContain('PREG-BLEEDING');
  });

  it('lets a danger sign override an otherwise answerable question', () => {
    expect(respond('ORS kaise banana hai, bachche ko jhatke aa rahe hain').category).toBe('REFER_NOW');
  });

  it('provides English answers even when a question is written in Hinglish', () => {
    const answer = respond('ORS kaise banana hai?');
    expect(answer.message).toBe('C1. Preparing ORS solution');
    expect(answer.details[0]).toBe('Wash your hands with soap and water.');

    const referral = respond('Teesre trimester me bleeding ho rahi hai.');
    expect(referral.message).toBe('Possible danger sign detected. Refer to the nearest health facility now.');
    expect(referral.details[0]).toBe('Vaginal bleeding during pregnancy or after delivery is a danger sign.');
  });

  it('gives symptom-specific next steps without inventing a diagnosis or protocol source', () => {
    const bodyPain = respond('i have body pains');
    expect(bodyPain.category).toBe('REFUSE');
    expect(bodyPain.message).toContain('cannot determine the cause');
    expect(bodyPain.details[0]).toContain('in-person assessment');
    expect(bodyPain.sources).toEqual([]);

    const yellowEyes = respond('my eyes became yellow from few days');
    expect(yellowEyes.message).toContain('prompt in-person medical assessment');
    expect(yellowEyes.details[0]).toContain('cannot determine the cause');
    expect(yellowEyes.sources).toEqual([]);

    const nailShape = respond('my nails were growing like parrot nose shape');
    expect(nailShape.message).toContain('change in nail shape');
    expect(nailShape.details[0]).toContain('in-person assessment');
    expect(nailShape.sources).toEqual([]);
  });

  it('refuses when no source clears the threshold', () => {
    const result = respond('What is the capital of France?');
    expect(result.category).toBe('REFUSE');
  });

  it('matches every expectation in the shared safety suite', () => {
    const failures = SAFETY_CASES.filter((c) => respond(c.query).category !== c.expected);
    expect(failures).toEqual([]);
  });

  it('displays every safety test question in English', () => {
    expect(SAFETY_CASES.every((testCase) => testCase.displayQuery.trim() !== '')).toBe(true);
    expect(SAFETY_CASES.map((testCase) => testCase.displayQuery)).not.toContain('ORS kaise banana hai?');
  });
});

describe('searchProtocols', () => {
  it('ranks the ORS section first for an ORS query', () => {
    expect(searchProtocols('ors', PROTOCOL_SECTIONS)[0].section.id).toBe('ors-prepare');
  });

  it('returns nothing for unrelated text', () => {
    expect(searchProtocols('cricket score', PROTOCOL_SECTIONS)).toEqual([]);
  });
});
