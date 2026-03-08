import { runMonteCarlo, MonteCarloInput } from '../lib/monteCarlo';

self.onmessage = (e: MessageEvent<MonteCarloInput>) => {
  self.postMessage(runMonteCarlo(e.data));
};
