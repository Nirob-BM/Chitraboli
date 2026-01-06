import { useState, useCallback, useRef } from "react";

interface RateLimitOptions {
  /** Maximum number of actions allowed within the time window */
  maxAttempts: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional callback when rate limit is exceeded */
  onRateLimitExceeded?: () => void;
}

interface RateLimitResult {
  /** Whether the action is currently allowed */
  isAllowed: boolean;
  /** Number of remaining attempts */
  remainingAttempts: number;
  /** Execute an action with rate limiting */
  executeWithLimit: <T>(action: () => Promise<T> | T) => Promise<T | null>;
  /** Reset the rate limiter */
  reset: () => void;
  /** Time until the rate limit resets (in ms) */
  timeUntilReset: number;
}

/**
 * Custom hook for rate limiting actions (e.g., form submissions, API calls)
 * Helps prevent abuse and protects against brute-force attacks
 */
export function useRateLimit(options: RateLimitOptions): RateLimitResult {
  const { maxAttempts, windowMs, onRateLimitExceeded } = options;
  
  const [attempts, setAttempts] = useState<number[]>([]);
  const windowStartRef = useRef<number>(Date.now());

  const cleanOldAttempts = useCallback(() => {
    const now = Date.now();
    const cutoff = now - windowMs;
    
    setAttempts((prev) => {
      const filtered = prev.filter((timestamp) => timestamp > cutoff);
      if (filtered.length === 0) {
        windowStartRef.current = now;
      }
      return filtered;
    });
  }, [windowMs]);

  const isAllowed = useCallback(() => {
    cleanOldAttempts();
    return attempts.length < maxAttempts;
  }, [attempts, maxAttempts, cleanOldAttempts]);

  const remainingAttempts = Math.max(0, maxAttempts - attempts.length);

  const timeUntilReset = useCallback(() => {
    if (attempts.length === 0) return 0;
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + windowMs;
    return Math.max(0, resetTime - Date.now());
  }, [attempts, windowMs]);

  const executeWithLimit = useCallback(
    async <T>(action: () => Promise<T> | T): Promise<T | null> => {
      cleanOldAttempts();
      
      if (attempts.length >= maxAttempts) {
        onRateLimitExceeded?.();
        return null;
      }

      setAttempts((prev) => [...prev, Date.now()]);
      
      try {
        return await action();
      } catch (error) {
        throw error;
      }
    },
    [attempts, maxAttempts, cleanOldAttempts, onRateLimitExceeded]
  );

  const reset = useCallback(() => {
    setAttempts([]);
    windowStartRef.current = Date.now();
  }, []);

  return {
    isAllowed: isAllowed(),
    remainingAttempts,
    executeWithLimit,
    reset,
    timeUntilReset: timeUntilReset(),
  };
}
