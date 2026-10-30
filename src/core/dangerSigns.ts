import type { DangerRule } from '../types';
import { containsTerm, normalize, tokenize } from './text';

/**
 * Rule-based danger-sign layer. It is deterministic, has no model dependency, and runs
 * before any answer generation. These are DEMONSTRATION rules, not reviewed against
 * official guidelines, and they do not understand negation ("no bleeding" still matches):
 * the layer intentionally errs towards referral.
 */
const PREGNANCY = ['pregnan', 'garbh', 'trimester', 'delivery', 'prasav', 'गर्भ', 'प्रेग्नेंट', 'तिमाही'];

export const DANGER_RULES: DangerRule[] = [
  {
    id: 'PREG-BLEEDING',
    label: 'Bleeding in pregnancy or after delivery',
    groups: [['bleed', 'khoon', 'blood', 'ब्लीडिंग', 'खून'], PREGNANCY],
    sectionId: 'preg-danger',
  },
  {
    id: 'PREG-HEADACHE-VISION',
    label: 'Severe headache with blurred vision in pregnancy',
    groups: [PREGNANCY, ['headache', 'sar dard', 'sir dard'], ['blurred', 'blurry', 'dhundhla', 'vision']],
    sectionId: 'preg-danger',
  },
  {
    id: 'PREG-REDUCED-MOVEMENT',
    label: 'Reduced baby movement in pregnancy',
    groups: [PREGNANCY, ['baby movement', 'less movement', 'no movement', 'movement kam', 'hil nahi', 'kam hil', 'hilna band']],
    sectionId: 'preg-danger',
  },
  {
    id: 'SEIZURE',
    label: 'Fits / convulsions',
    groups: [['fits', 'seizure', 'convuls', 'jhatke', 'jhatka', 'daura', 'दौरा']],
    sectionId: 'preg-danger',
  },
  {
    id: 'UNCONSCIOUS',
    label: 'Unconscious or unresponsive person',
    groups: [['unconscious', 'unresponsive', 'behosh', 'hosh nahi', 'not waking', 'बेहोश']],
    sectionId: 'newborn-danger',
  },
  {
    id: 'BREATHING',
    label: 'Difficulty or fast breathing',
    groups: [['breathless', 'difficulty breathing', 'trouble breathing', 'fast breathing', 'saans lene me', 'saans phool', 'tez saans']],
    sectionId: 'newborn-danger',
  },
  {
    id: 'NEWBORN-NOT-FEEDING',
    label: 'Newborn not feeding',
    groups: [
      ['newborn', 'new born', 'nawjaat', 'navjaat', 'naya janma'],
      ['not feeding', 'not breastfeeding', 'not sucking', 'doodh nahi', 'feeding nahi', 'stopped feeding'],
    ],
    sectionId: 'newborn-danger',
  },
  {
    id: 'DIARRHOEA-BLOOD',
    label: 'Blood in stool',
    groups: [['blood', 'khoon'], ['stool', 'potty', 'motion', 'latrine', 'dast']],
    sectionId: 'child-danger',
  },
];

export interface DangerCheck {
  matched: DangerRule[];
  elapsedMs: number;
}

export function matchesRule(rule: DangerRule, normalized: string, tokens: string[]): boolean {
  return rule.groups.every((group) => group.some((term) => containsTerm(normalized, tokens, term)));
}

export function checkDangerSigns(query: string, rules: DangerRule[] = DANGER_RULES): DangerCheck {
  const start = performance.now();
  const normalized = normalize(query);
  const tokens = tokenize(normalized);
  const matched = rules.filter((rule) => matchesRule(rule, normalized, tokens));
  return { matched, elapsedMs: performance.now() - start };
}
