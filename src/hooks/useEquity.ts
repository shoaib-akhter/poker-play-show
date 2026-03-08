import { useState, useEffect, useRef, useCallback } from 'react';
import type { MonteCarloResult, MonteCarloInput } from '@/lib/monteCarlo';

export type { MonteCarloResult };

export function useEquity(
  heroCards: number[],
  boardCards: number[],
  numOpponents: number,
  simulations = 5000,
): { result: MonteCarloResult | null; loading: boolean } {
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Instantiate worker once
    workerRef.current = new Worker(
      new URL('../workers/equityWorker.ts', import.meta.url),
      { type: 'module' },
    );

    workerRef.current.onmessage = (e: MessageEvent<MonteCarloResult>) => {
      setResult(e.data);
      setLoading(false);
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const postMessage = useCallback(() => {
    if (!workerRef.current) return;
    if (heroCards.length !== 2) {
      setResult(null);
      setLoading(false);
      return;
    }
    const input: MonteCarloInput = { heroCards, boardCards, numOpponents, simulations };
    setLoading(true);
    workerRef.current.postMessage(input);
  }, [heroCards, boardCards, numOpponents, simulations]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(postMessage, 200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [postMessage]);

  return { result, loading };
}
