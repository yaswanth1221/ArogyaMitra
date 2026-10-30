import { DEFAULT_WEIGHTS } from '../config/appConfig';
import type { ChatMessage, Household, PriorityWeights, VisitNote } from '../types';
import { clearStore, getAll, getOne, putMany, putOne } from './idb';

interface SettingRecord<T> {
  key: string;
  value: T;
}

async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await getOne<SettingRecord<T>>('settings', key))?.value;
}

async function setSetting<T>(key: string, value: T): Promise<void> {
  await putOne<SettingRecord<T>>('settings', { key, value });
}

export const repository = {
  loadHouseholds: () => getAll<Household>('households'),
  saveHousehold: (h: Household) => putOne('households', h),
  saveHouseholds: (list: Household[]) => putMany('households', list),
  loadNotes: () => getAll<VisitNote>('notes'),
  saveNote: (n: VisitNote) => putOne('notes', n),
  loadChat: async () => (await getAll<ChatMessage>('chat')).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  saveChat: (messages: ChatMessage[]) => putMany('chat', messages),
  clearChat: () => clearStore('chat'),
  isSeeded: async () => (await getSetting<boolean>('seeded')) === true,
  markSeeded: () => setSetting('seeded', true),
  loadWeights: async (): Promise<PriorityWeights> => ({ ...DEFAULT_WEIGHTS, ...(await getSetting<PriorityWeights>('weights')) }),
  saveWeights: (w: PriorityWeights) => setSetting('weights', w),
  /** Clears households, notes, sync queue and settings (including weights); chat history is kept. */
  async resetRecords(): Promise<void> {
    await Promise.all([clearStore('households'), clearStore('notes'), clearStore('syncQueue'), clearStore('settings')]);
  },
};
