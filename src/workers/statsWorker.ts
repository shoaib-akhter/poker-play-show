import { parseHandHistory } from '@/lib/handHistoryParser';
import { parseDateFromHeader } from '@/lib/handSplitter';
import { computeHandStats } from '@/lib/handStats';
import { HandStats } from '@/types/poker';

interface WorkerInput {
  handRaws: { handId: string; rawText: string }[];
}

interface MetaCorrection {
  handId: string;
  heroName: string;
  heroResult: number;
}

interface ProgressMessage {
  type: 'progress';
  processed: number;
  total: number;
  stats: HandStats[];
  metaCorrections: MetaCorrection[];
}

interface DoneMessage {
  type: 'done';
  totalProcessed: number;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { handRaws } = e.data;
  const BATCH_SIZE = 100;
  const total = handRaws.length;
  let processed = 0;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = handRaws.slice(i, i + BATCH_SIZE);
    const stats: HandStats[] = [];
    const metaCorrections: MetaCorrection[] = [];

    for (const { rawText } of batch) {
      try {
        const parsed = parseHandHistory(rawText);
        const firstLine = rawText.split('\n')[0] ?? '';
        const playedAt = parseDateFromHeader(firstLine);
        const hs = computeHandStats(parsed, parsed.stakes, playedAt);
        if (hs) {
          stats.push(hs);
          metaCorrections.push({
            handId: parsed.handId,
            heroName: parsed.heroName,
            heroResult: hs.heroResult,
          });
        }
        processed++;
      } catch {
        // skip malformed hands
      }
    }

    const msg: ProgressMessage = { type: 'progress', processed, total, stats, metaCorrections };
    self.postMessage(msg);
  }

  const done: DoneMessage = { type: 'done', totalProcessed: processed };
  self.postMessage(done);
};

export {};
