export const MEMBER_CATEGORIES = [
  'Pregnant woman',
  'Recently delivered mother',
  'Newborn (0-28 days)',
  'Infant (under 1 year)',
  'Child (1-5 years)',
  'Adolescent girl',
  'Adult with chronic condition',
] as const;

export const VISIT_TYPES = [
  'ANC visit',
  'PNC home visit',
  'Newborn home visit',
  'Immunisation follow-up',
  'Growth monitoring',
  'Anaemia counselling',
  'NCD screening follow-up',
] as const;

export const PRIORITIES = ['High', 'Medium', 'Low'] as const;

/** Which visit types make sense for each member category (used by the demo generator). */
export const VISITS_BY_CATEGORY: Record<(typeof MEMBER_CATEGORIES)[number], (typeof VISIT_TYPES)[number][]> = {
  'Pregnant woman': ['ANC visit', 'Anaemia counselling'],
  'Recently delivered mother': ['PNC home visit'],
  'Newborn (0-28 days)': ['Newborn home visit'],
  'Infant (under 1 year)': ['Immunisation follow-up', 'Growth monitoring'],
  'Child (1-5 years)': ['Growth monitoring', 'Immunisation follow-up'],
  'Adolescent girl': ['Anaemia counselling'],
  'Adult with chronic condition': ['NCD screening follow-up'],
};

/** Andhra Pradesh place names used only for synthetic demo records. */
export const DEMO_VILLAGES = [
  'Undavalli', 'Penumaka', 'Kankipadu', 'Vuyyuru', 'Gannavaram', 'Kondapalli',
  'Ibrahimpatnam', 'Poranki', 'Nidamanuru', 'Namburu', 'Kaza', 'Gorantla',
] as const;

export const LEGACY_DEMO_VILLAGES = [
  'Rampur Kalan', 'Sundarpur', 'Chandanwadi', 'Bhagwanpur', 'Laxmipur', 'Keshavgarh',
  'Nayagaon', 'Pipalwadi', 'Hariharpur', 'Mohanpur', 'Ganeshpur', 'Devrampur',
];
