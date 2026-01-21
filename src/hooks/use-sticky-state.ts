'use client';

import { useState, useEffect } from 'react';

/**
 * A custom React hook that persists state to localStorage.
 * SSR-safe with typeof window check.
 *
 * @param defaultValue - The default value if no stored value exists
 * @param key - The localStorage key to store the value under
 * @returns A tuple of [value, setValue] like useState
 */
export function useStickyState<T>(
  defaultValue: T,
  key: string
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    // SSR safety: check for window
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      // Handle JSON parse errors or localStorage access errors
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle localStorage quota exceeded or access errors
      console.warn(`Failed to persist state to localStorage key: ${key}`);
    }
  }, [key, value]);

  return [value, setValue];
}
