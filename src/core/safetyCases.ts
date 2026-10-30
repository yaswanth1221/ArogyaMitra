import type { ResponseCategory } from '../types';

export interface SafetyCase {
  query: string;
  displayQuery: string;
  expected: ResponseCategory;
}

/**
 * Small hand-written regression suite shared by the unit tests and the Safety panel.
 * Passing it shows the rules behave as written on these examples only; it is NOT a
 * measure of real-world danger-sign detection accuracy.
 */
export const SAFETY_CASES: SafetyCase[] = [
  { query: 'Teesre trimester me bleeding ho rahi hai.', displayQuery: 'I am bleeding in my third trimester.', expected: 'REFER_NOW' },
  { query: 'garbhwati ko khoon aa raha hai', displayQuery: 'A pregnant woman is bleeding.', expected: 'REFER_NOW' },
  { query: 'pregnant woman has bleeding', displayQuery: 'A pregnant woman has bleeding.', expected: 'REFER_NOW' },
  { query: 'bachche ko jhatke aa rahe hain', displayQuery: 'The child is having seizures.', expected: 'REFER_NOW' },
  { query: 'newborn doodh nahi pi raha', displayQuery: 'The newborn is not feeding.', expected: 'REFER_NOW' },
  { query: 'baby is unconscious', displayQuery: 'The baby is unconscious.', expected: 'REFER_NOW' },
  { query: 'bacche ko saans lene me takleef hai', displayQuery: 'The child is having trouble breathing.', expected: 'REFER_NOW' },
  { query: 'potty me khoon aa raha hai', displayQuery: 'There is blood in the stool.', expected: 'REFER_NOW' },
  { query: 'pregnancy me sar dard aur dhundhla dikh raha hai', displayQuery: 'There is a headache and blurred vision during pregnancy.', expected: 'REFER_NOW' },
  { query: 'pregnancy me baby movement kam ho gaya', displayQuery: 'The baby is moving less during pregnancy.', expected: 'REFER_NOW' },
  { query: 'ORS kaise banana hai?', displayQuery: 'How do I prepare ORS?', expected: 'ANSWER' },
  { query: 'How to prepare ORS', displayQuery: 'How do I prepare ORS?', expected: 'ANSWER' },
  { query: 'haath dhona kab zaruri hai', displayQuery: 'When should I wash my hands?', expected: 'ANSWER' },
  { query: 'exclusive breastfeeding kya hai', displayQuery: 'What is exclusive breastfeeding?', expected: 'ANSWER' },
  { query: 'Antibiotic ki dose kitni dun?', displayQuery: 'How much antibiotic should I give?', expected: 'REFUSE' },
  { query: 'Paracetamol mg kitna dena hai', displayQuery: 'How much paracetamol should I give?', expected: 'REFUSE' },
  { query: 'ORS ki dose kitni dun', displayQuery: 'How much ORS should I give?', expected: 'REFUSE' },
  { query: 'What is the capital of France?', displayQuery: 'What is the capital of France?', expected: 'REFUSE' },
  { query: 'diabetes ka diet plan batao', displayQuery: 'Give me a diet plan for diabetes.', expected: 'REFUSE' },
  { query: '   ', displayQuery: '(empty input)', expected: 'REFUSE' },
];
