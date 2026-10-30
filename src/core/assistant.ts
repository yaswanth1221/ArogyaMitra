import { PROTOCOL_SECTIONS, findSection } from '../data/protocols';
import type { AssistantResult, ProtocolSection, SourceRef } from '../types';
import { checkDangerSigns } from './dangerSigns';
import { bestSupportedHit } from './retrieval';
import { containsTerm, normalize, tokenize } from './text';

/** Questions about medicines/doses are never answered, even if protocol text matches. */
const OUT_OF_SCOPE_TERMS = [
  'dose', 'dosage', 'dosing', 'mg', 'ml', 'tablet', 'antibiotic', 'injection',
  'medicine', 'dawai', 'dawa', 'goli', 'kitni dun', 'prescription',
];

const REFUSAL_FOOTER = 'Please consult a qualified healthcare professional (ANM, Medical Officer, or doctor).';

const SYMPTOM_GUIDANCE = [
  {
    matches: [['body pain'], ['body pains'], ['body ache'], ['body aches'], ['aches all over'], ['pain all over']],
    message: 'I cannot determine the cause of body pain from a chat.',
    details: [
      'Arrange an in-person assessment if the pain is severe, persistent, or getting worse.',
      'Seek urgent care for severe pain or pain with chest pain, trouble breathing, fainting, or confusion.',
    ],
  },
  {
    matches: [['yellow eyes'], ['eyes became yellow'], ['eyes turning yellow'], ['yellowing of the eyes'], ['eyes are yellow'], ['yellow whites of the eyes']],
    message: 'Yellowing of the eyes needs prompt in-person medical assessment.',
    details: [
      'Please contact a qualified healthcare professional promptly; this chatbot cannot determine the cause.',
      'Seek urgent care if you feel very unwell or have severe abdominal pain, repeated vomiting, fainting, or confusion.',
    ],
  },
  {
    matches: [['parrot nose'], ['nail shape'], ['nail changes'], ['nails are curved'], ['curved nails'], ['nails changing shape']],
    message: 'A change in nail shape should be assessed by a healthcare professional.',
    details: [
      'Arrange an in-person assessment, especially if the change is new or you have other symptoms.',
      'This chatbot cannot determine the cause or diagnose a condition from nail appearance.',
    ],
  },
] as const;

function toSource(section: ProtocolSection): SourceRef {
  return { document: section.document, section: section.title, reviewStatus: section.reviewStatus };
}

function refuse(message: string, scope: ProtocolSection | undefined): Omit<AssistantResult, 'dangerCheckMs' | 'totalMs'> {
  return {
    category: 'REFUSE',
    message,
    details: [REFUSAL_FOOTER],
    sources: scope ? [toSource(scope)] : [],
    matchedRules: [],
  };
}

/**
 * Pipeline: 1) danger-sign rules (override everything), 2) scope check, 3) local retrieval.
 * Answers are extracted verbatim from the protocol section, never generated, so no
 * medical fact or citation can be invented. A small on-device LLM could later replace
 * step 3's formatting only; steps 1 and 2 must stay model-independent.
 */
export function respond(query: string, sections: ProtocolSection[] = PROTOCOL_SECTIONS): AssistantResult {
  const start = performance.now();
  const danger = checkDangerSigns(query);
  const finish = (base: Omit<AssistantResult, 'dangerCheckMs' | 'totalMs'>): AssistantResult => ({
    ...base,
    dangerCheckMs: danger.elapsedMs,
    totalMs: performance.now() - start,
  });

  if (danger.matched.length > 0) {
    const sectionIds = [...new Set(danger.matched.map((rule) => rule.sectionId))];
    const found = sectionIds.map(findSection).filter((s): s is ProtocolSection => s !== undefined);
    return finish({
      category: 'REFER_NOW',
      message: 'Possible danger sign detected. Refer to the nearest health facility now.',
      details: found.flatMap((section) => section.body),
      sources: found.map(toSource),
      matchedRules: danger.matched.map(({ id, label }) => ({ id, label })),
    });
  }

  const normalized = normalize(query);
  const tokens = tokenize(normalized);
  const scope = sections.find((s) => s.id === 'scope-limits');

  if (normalized === '') return finish(refuse('No question was entered.', undefined));
  if (OUT_OF_SCOPE_TERMS.some((term) => containsTerm(normalized, tokens, term))) {
    return finish(refuse('Medicine names and doses are outside the approved scope of this assistant.', scope));
  }

  const symptom = SYMPTOM_GUIDANCE.find(({ matches }) =>
    matches.some((terms) => terms.every((term) => containsTerm(normalized, tokens, term))),
  );
  if (symptom) {
    return finish({
      category: 'REFUSE',
      message: symptom.message,
      details: [...symptom.details, REFUSAL_FOOTER],
      sources: [],
      matchedRules: [],
    });
  }

  const hit = bestSupportedHit(query, sections);
  if (!hit) {
    return finish(refuse('No reliable approved protocol source was found for this question.', scope));
  }
  return finish({
    category: 'ANSWER',
    message: hit.section.title,
    details: hit.section.body,
    sources: [toSource(hit.section)],
    matchedRules: [],
  });
}
