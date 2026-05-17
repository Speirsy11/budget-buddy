import { useEffect, useState } from "react";

const DEFAULT_TIMEOUT_MS = 2500;

export function useTimedLoading(
  isLoading: boolean,
  timeoutMs = DEFAULT_TIMEOUT_MS
): boolean {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timeout);
  }, [isLoading, timeoutMs]);

  return isLoading && !timedOut;
}
