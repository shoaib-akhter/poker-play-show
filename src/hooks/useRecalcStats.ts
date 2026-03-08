import { useState, useRef, useCallback } from 'react';
import { getAllRawTexts, putHandStatsBatch, fixMetaHeroResults } from '@/lib/db';
import { HandStats } from '@/types/poker';

interface MetaCorrection {
  handId: string;
  heroName: string;
  heroResult: number;
}

interface RecalcState {
  isRunning: boolean;
  processed: number;
  total: number;
}

export function useRecalcStats(onComplete: () => void) {
  const [state, setState] = useState<RecalcState>({ isRunning: false, processed: 0, total: 0 });
  const workerRef = useRef<Worker | null>(null);

  const runRecalc = useCallback(async () => {
    const handRaws = await getAllRawTexts();
    if (handRaws.length === 0) {
      onComplete();
      return;
    }

    setState({ isRunning: true, processed: 0, total: handRaws.length });

    workerRef.current?.terminate();
    const worker = new Worker(
      new URL('../workers/statsWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = async (e: MessageEvent) => {
      const data = e.data as
        | { type: 'progress'; processed: number; total: number; stats: HandStats[]; metaCorrections: MetaCorrection[] }
        | { type: 'done'; totalProcessed: number };

      if (data.type === 'progress') {
        await Promise.all([
          putHandStatsBatch(data.stats),
          fixMetaHeroResults(data.metaCorrections),
        ]);
        setState(prev => ({ ...prev, processed: data.processed }));
      } else if (data.type === 'done') {
        setState({ isRunning: false, processed: 0, total: 0 });
        worker.terminate();
        workerRef.current = null;
        onComplete();
      }
    };

    worker.onerror = (err) => {
      console.error('Stats worker error:', err);
      setState({ isRunning: false, processed: 0, total: 0 });
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({ handRaws });
  }, [onComplete]);

  return { state, runRecalc };
}
