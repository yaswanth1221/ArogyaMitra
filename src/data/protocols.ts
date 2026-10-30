import type { ProtocolSection } from '../types';

/**
 * DEMONSTRATION protocol dataset. This text is a short, general paraphrase written for the
 * hackathon demo. It has NOT been reviewed against official MoHFW/NHM guidance and must not
 * be used as clinical guidance. To use approved documents, replace the entries below with
 * sections extracted from the project owner's documents (keep document + section names
 * exact) and set reviewStatus to the review record.
 */
export const DEMO_STATUS = 'DEMO - not reviewed against official guidelines';

const MATERNAL = 'DEMO Protocol Pack A - Maternal Health';
const CHILD = 'DEMO Protocol Pack B - Newborn and Child Health';
const HYDRATION = 'DEMO Protocol Pack C - Hydration and Hygiene';
const SCOPE = 'DEMO Protocol Pack D - Scope and Limits';

export const PROTOCOL_SECTIONS: ProtocolSection[] = [
  {
    id: 'preg-danger',
    document: MATERNAL,
    title: 'A1. Danger signs in pregnancy and after delivery',
    reviewStatus: DEMO_STATUS,
    body: [
      'Vaginal bleeding during pregnancy or after delivery is a danger sign.',
      'Fits, severe headache with blurred vision, or reduced baby movement are also danger signs.',
      'Action: refer the woman to the nearest health facility immediately and arrange transport.',
    ],
    keywords: [['pregnan', 1], ['danger signs', 1], ['garbh', 1]],
  },
  {
    id: 'newborn-danger',
    document: CHILD,
    title: 'B1. Newborn danger signs',
    reviewStatus: DEMO_STATUS,
    body: [
      'A newborn who is not feeding, has fits, is very drowsy, or breathes fast needs urgent care.',
      'Action: refer the newborn to the nearest health facility immediately.',
    ],
    keywords: [['newborn', 1], ['nawjaat', 1], ['navjaat', 1], ['new born', 1], ['danger signs', 1]],
  },
  {
    id: 'child-danger',
    document: CHILD,
    title: 'B2. Danger signs in a child with diarrhoea',
    reviewStatus: DEMO_STATUS,
    body: [
      'Blood in the stool, being unable to drink, or being very drowsy are danger signs.',
      'Action: refer the child to the nearest health facility immediately.',
    ],
    keywords: [['diarrhoea', 1], ['diarrhea', 1], ['dast', 1], ['loose motion', 1], ['danger signs', 1], ['sunken', 1]],
  },
  {
    id: 'breastfeeding',
    document: CHILD,
    title: 'B3. Exclusive breastfeeding',
    reviewStatus: DEMO_STATUS,
    body: [
      'Exclusive breastfeeding means the baby receives only breast milk for the first six months.',
      'No water, honey, or other foods are given during this period unless advised by a health professional.',
    ],
    keywords: [['breastfeeding', 2], ['breastfeed', 2], ['breast milk', 2], ['stanpan', 2], ['doodh pilana', 2], ['exclusive', 1]],
  },
  {
    id: 'ors-prepare',
    document: HYDRATION,
    title: 'C1. Preparing ORS solution',
    reviewStatus: DEMO_STATUS,
    body: [
      'Wash your hands with soap and water.',
      'Use clean drinking water in the quantity printed on the ORS packet.',
      'Empty the whole packet into the water and stir until it dissolves.',
      'Give small, frequent sips. Prepare a fresh solution every 24 hours and discard the old one.',
    ],
    keywords: [['ors', 2], ['oral rehydration', 2], ['rehydration', 2], ['dehydration', 1], ['dast', 1], ['diarrhoea', 1], ['diarrhea', 1], ['loose motion', 1], ['ghol', 1]],
  },
  {
    id: 'handwash',
    document: HYDRATION,
    title: 'C2. Hand washing',
    reviewStatus: DEMO_STATUS,
    body: [
      'Wash hands with soap and running water before preparing food, before feeding a child, and after using the toilet.',
      'Rub all surfaces of the hands for at least 20 seconds, then rinse and dry with a clean cloth.',
    ],
    keywords: [['handwash', 2], ['hand wash', 2], ['haath dhona', 2], ['haath dhone', 2], ['soap', 1], ['hygiene', 1]],
  },
  {
    id: 'scope-limits',
    document: SCOPE,
    title: 'D1. What this assistant does not cover',
    reviewStatus: DEMO_STATUS,
    body: [
      'Medicine names, doses, and prescriptions are outside the scope of this assistant.',
      'Consult a qualified healthcare professional (ANM, Medical Officer, or doctor) for these questions.',
    ],
    keywords: [],
  },
];

export function findSection(id: string): ProtocolSection | undefined {
  return PROTOCOL_SECTIONS.find((section) => section.id === id);
}
