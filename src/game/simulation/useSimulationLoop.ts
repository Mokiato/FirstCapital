import { useEffect, useRef } from 'react';

interface SimulationLoopOptions {
  paused: boolean;
  enabled?: boolean;
  onAdvance: (realDeltaMs: number) => void;
}

export function useSimulationLoop({
  paused,
  enabled = true,
  onAdvance,
}: SimulationLoopOptions): void {
  const callbackRef = useRef(onAdvance);

  useEffect(() => {
    callbackRef.current = onAdvance;
  }, [onAdvance]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    let animationFrame = 0;
    let lastTime = performance.now();

    const resetTime = () => {
      lastTime = performance.now();
    };

    const frame = (now: number) => {
      const delta = Math.max(0, Math.min(1000, now - lastTime));
      lastTime = now;

      const pageVisible =
        typeof document === 'undefined' ||
        document.visibilityState === 'visible';

      if (!paused && pageVisible && delta > 0) {
        callbackRef.current(delta);
      }

      animationFrame = requestAnimationFrame(frame);
    };

    document.addEventListener('visibilitychange', resetTime);
    animationFrame = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('visibilitychange', resetTime);
    };
  }, [enabled, paused]);
}