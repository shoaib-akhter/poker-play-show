import { useState, useRef, useCallback } from 'react';
import { splitHandFile } from '@/lib/handSplitter';
import { putHandBatch } from '@/lib/db';
import { HandMeta, HandRaw, HandStats } from '@/types/poker';
import { toast } from 'sonner';

interface ImportState {
  isImporting: boolean;
  processed: number;
  total: number;
}

export function useImport(onComplete: () => void) {
  const [state, setState] = useState<ImportState>({ isImporting: false, processed: 0, total: 0 });
  const workerRef = useRef<Worker | null>(null);

  const runImport = useCallback(async (files: File[]) => {
    // Read all files and split into individual hand texts
    const allHandTexts: string[] = [];
    for (const file of files) {
      const text = await file.text();
      const hands = splitHandFile(text);
      allHandTexts.push(...hands);
    }

    if (allHandTexts.length === 0) {
      toast.error('No valid hand histories found in the selected files.');
      return;
    }

    setState({ isImporting: true, processed: 0, total: allHandTexts.length });

    // Terminate previous worker if any
    workerRef.current?.terminate();
    const worker = new Worker(
      new URL('../workers/importWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = async (e: MessageEvent) => {
      const data = e.data as
        | { type: 'progress'; processed: number; total: number; metas: HandMeta[]; raws: HandRaw[]; stats: HandStats[] }
        | { type: 'done'; totalImported: number };

      if (data.type === 'progress') {
        await putHandBatch(data.metas, data.raws, data.stats);
        setState(prev => ({ ...prev, processed: data.processed }));
      } else if (data.type === 'done') {
        setState({ isImporting: false, processed: 0, total: 0 });
        worker.terminate();
        workerRef.current = null;
        toast.success(`Import complete — ${data.totalImported.toLocaleString()} hands imported.`);
        onComplete();
      }
    };

    worker.onerror = (err) => {
      console.error('Import worker error:', err);
      setState({ isImporting: false, processed: 0, total: 0 });
      worker.terminate();
      workerRef.current = null;
      toast.error('Import failed. Check console for details.');
    };

    worker.postMessage({ handTexts: allHandTexts, batchIndex: 0 });
  }, [onComplete]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const txtFiles = Array.from(files).filter(f => f.name.endsWith('.txt'));
    if (txtFiles.length === 0) {
      toast.error('Please select .txt files containing hand histories.');
      return;
    }
    void runImport(txtFiles);
  }, [runImport]);

  return { state, handleFiles };
}
