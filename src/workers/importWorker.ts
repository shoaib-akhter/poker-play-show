import { parseHandHistory } from '@/lib/handHistoryParser';
import { splitHandFile, parseDateFromHeader } from '@/lib/handSplitter';
import { extractHeroResult } from '@/lib/heroResult';
import { HandMeta, HandRaw } from '@/types/poker';

interface WorkerInput {
  handTexts: string[];
  batchIndex: number;
}

interface ProgressMessage {
  type: 'progress';
  processed: number;
  total: number;
  metas: HandMeta[];
  raws: HandRaw[];
}

interface DoneMessage {
  type: 'done';
  totalImported: number;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { handTexts, batchIndex: _batchIndex } = e.data;
  const BATCH_SIZE = 100;
  let processed = 0;
  const total = handTexts.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = handTexts.slice(i, i + BATCH_SIZE);
    const metas: HandMeta[] = [];
    const raws: HandRaw[] = [];

    for (const rawText of batch) {
      try {
        const parsed = parseHandHistory(rawText);
        const { heroName, heroResult } = extractHeroResult(parsed);
        const firstLine = rawText.split('\n')[0] ?? '';
        const playedAt = parseDateFromHeader(firstLine);

        metas.push({
          handId: parsed.handId,
          tableName: parsed.tableName,
          stakes: parsed.stakes,
          playedAt,
          heroName,
          heroResult,
          playerCount: parsed.players.length,
        });

        raws.push({ handId: parsed.handId, rawText });
        processed++;
      } catch {
        // skip malformed hands
      }
    }

    const msg: ProgressMessage = { type: 'progress', processed, total, metas, raws };
    self.postMessage(msg);
  }

  const done: DoneMessage = { type: 'done', totalImported: processed };
  self.postMessage(done);
};

// Needed to satisfy TypeScript module isolation
export {};
