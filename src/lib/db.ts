import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { HandMeta, HandRaw, HandStats } from '@/types/poker';

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
  hand_stats: {
    key: string;
    value: HandStats;
  };
}

let dbPromise: Promise<IDBPDatabase<PokerDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PokerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PokerDB>('poker-replay-db', 4, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const metaStore = db.createObjectStore('hand_meta', { keyPath: 'handId' });
          metaStore.createIndex('by_date', 'playedAt');
          metaStore.createIndex('by_result', 'heroResult');
          db.createObjectStore('hand_raw', { keyPath: 'handId' });
        }
        if (oldVersion < 2) {
          db.createObjectStore('hand_stats', { keyPath: 'handId' });
        }
        if (oldVersion < 4) {
          // Clear hand_stats so corrected showdown detection logic is applied on next recalc
          transaction.objectStore('hand_stats').clear();
        }
      },
    });
  }
  return dbPromise;
}

export async function putHandBatch(
  metas: HandMeta[],
  raws: HandRaw[],
  stats: HandStats[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['hand_meta', 'hand_raw', 'hand_stats'], 'readwrite');
  const metaStore = tx.objectStore('hand_meta');
  const rawStore = tx.objectStore('hand_raw');
  const statsStore = tx.objectStore('hand_stats');
  await Promise.all([
    ...metas.map(m => metaStore.put(m)),
    ...raws.map(r => rawStore.put(r)),
    ...stats.map(s => statsStore.put(s)),
    tx.done,
  ]);
}

export async function putHandStatsBatch(stats: HandStats[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('hand_stats', 'readwrite');
  const store = tx.objectStore('hand_stats');
  await Promise.all([...stats.map(s => store.put(s)), tx.done]);
}

export async function getAllMeta(): Promise<HandMeta[]> {
  const db = await getDB();
  return db.getAll('hand_meta');
}

export async function getAllHandStats(): Promise<HandStats[]> {
  const db = await getDB();
  return db.getAll('hand_stats');
}

export async function getRawText(handId: string): Promise<string | undefined> {
  const db = await getDB();
  const record = await db.get('hand_raw', handId);
  return record?.rawText;
}

export async function getAllRawTexts(): Promise<HandRaw[]> {
  const db = await getDB();
  return db.getAll('hand_raw');
}

export async function getHandCount(): Promise<number> {
  const db = await getDB();
  return db.count('hand_meta');
}

export async function getHandStatsCount(): Promise<number> {
  const db = await getDB();
  return db.count('hand_stats');
}

export async function fixMetaHeroResults(
  corrections: { handId: string; heroName: string; heroResult: number }[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('hand_meta', 'readwrite');
  const store = tx.objectStore('hand_meta');
  await Promise.all(corrections.map(async ({ handId, heroName, heroResult }) => {
    const meta = await store.get(handId);
    if (meta) {
      meta.heroName = heroName;
      meta.heroResult = heroResult;
      await store.put(meta);
    }
  }));
  await tx.done;
}
