"use client";

import { useCallback, useMemo, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";

type UsePersistentStateOptions<T> = {
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
};

const CHANGE_EVENT = "nour:persistent-state";
const temporaryValues = new Map<string, string>();
const getServerSnapshot = () => null;

export default function usePersistentState<T>(
  key: string,
  initialValue: T,
  options: UsePersistentStateOptions<T> = {},
): [T, Dispatch<SetStateAction<T>>] {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;

  const getSnapshot = useCallback(() => {
    if (temporaryValues.has(key)) return temporaryValues.get(key)!;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === key) {
        temporaryValues.delete(key);
        notify();
      }
    };
    const onChange = (event: Event) => {
      if ((event as CustomEvent<string>).detail === key) notify();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onChange);
    };
  }, [key]);

  const storedValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const decode = useCallback((raw: string | null): T => {
    if (raw !== null) {
      try { return deserialize(raw); } catch { /* Use the default for invalid saved data. */ }
    }
    return initialValue;
  }, [deserialize, initialValue]);
  const value = useMemo(() => decode(storedValue), [decode, storedValue]);

  const setPersistentValue: Dispatch<SetStateAction<T>> = useCallback((nextValue) => {
    const current = decode(getSnapshot());
    const resolved = typeof nextValue === "function"
      ? (nextValue as (previous: T) => T)(current)
      : nextValue;
    const serialized = serialize(resolved);
    try {
      window.localStorage.setItem(key, serialized);
      temporaryValues.delete(key);
    } catch {
      // Keep controls usable when browser storage is unavailable or full.
      temporaryValues.set(key, serialized);
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
  }, [decode, getSnapshot, key, serialize]);

  return [value, setPersistentValue];
}
