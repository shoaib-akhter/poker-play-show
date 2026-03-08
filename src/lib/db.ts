import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { HandMeta, HandRaw } from '@/types/poker';

interface PokerDB extends DBSchema {
  hand_meta: {
    key: string;
    value: HandMeta;
    indexes: { by_date: number; by_result: number };
  };
  hand_raw: {
    key: string;
    value: HandRaw;
  };
}

let dbPromise: Promise<IDBPDatabase<PokerDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PokerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PokerDB>('poker-replay-db', 1, {
      upgrade(db) {
        const metaStore = db.createObjectStore('hand_meta', { keyPath: 'handId' });
        metaStore.createIndex('by_date', 'playedAt');
        metaStore.createIndex('by_result', 'heroResult');

        db.createObjectStore('hand_raw', { keyPath: 'handId' });
      },
    });
  }
  return dbPromise;
}

export async function putHandBatch(metas: HandMeta[], raws: HandRaw[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['hand_meta', 'hand_raw'], 'readwrite');
  const metaStore = tx.objectStore('hand_meta');
  const rawStore = tx.objectStore('hand_raw');
  await Promise.all([
    ...metas.map(m => metaStore.put(m)),
    ...raws.map(r => rawStore.put(r)),
    tx.done,
  ]);
}

export async function getAllMeta(): Promise<HandMeta[]> {
  const db = await getDB();
  return db.getAll('hand_meta');
}

export async function getRawText(handId: string): Promise<string | undefined> {
  const db = await getDB();
  const record = await db.get('hand_raw', handId);
  return record?.rawText;
}

export async function getHandCount(): Promise<number> {
  const db = await getDB();
  return db.count('hand_meta');
}
