export type Priority = 'High' | 'Medium' | 'Low';
export type VisitStatus = 'Pending' | 'Completed';

export interface Household {
  id: string;
  village: string;
  memberCategory: string;
  visitType: string;
  /** ISO date, YYYY-MM-DD */
  dueDate: string;
  priority: Priority;
  status: VisitStatus;
  completedAt?: string;
  /** true for generated synthetic records; false for records entered in the app */
  isDemo: boolean;
}

export interface VisitNote {
  id: string;
  householdId: string;
  text: string;
  createdAt: string;
}

export type ResponseCategory = 'ANSWER' | 'REFUSE' | 'REFER_NOW';

export interface SourceRef {
  document: string;
  section: string;
  reviewStatus: string;
}

export interface ProtocolSection {
  id: string;
  document: string;
  title: string;
  reviewStatus: string;
  body: string[];
  /** [term, weight] pairs used by the local retrieval index */
  keywords: [string, number][];
}

export interface DangerRule {
  id: string;
  label: string;
  /** Rule fires when every group has at least one matching term. */
  groups: string[][];
  sectionId: string;
}

export interface AssistantResult {
  category: ResponseCategory;
  message: string;
  details: string[];
  sources: SourceRef[];
  matchedRules: { id: string; label: string }[];
  dangerCheckMs: number;
  totalMs: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  result?: AssistantResult;
}

export interface PriorityWeights {
  overduePerDay: number;
  overdueCap: number;
  high: number;
  medium: number;
  low: number;
  dueToday: number;
}

export interface SyncItem {
  id: string;
  entity: 'household' | 'note';
  op: 'upsert';
  payload: unknown;
  createdAt: string;
}
