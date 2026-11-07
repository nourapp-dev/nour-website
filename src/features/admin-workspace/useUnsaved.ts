"use client";
import { useEffect, useState } from "react";
const dirtyForms = new Map<symbol, string>();
export function confirmLeaving(message: string) {
  return !dirtyForms.size || window.confirm(message);
}
function unload(event: BeforeUnloadEvent) {
  event.preventDefault();
  event.returnValue = "";
}
function navigate(event: MouseEvent) {
  const link = (event.target as Element).closest("a");
  if (
    !link ||
    event.defaultPrevented ||
    link.target === "_blank" ||
    link.href === window.location.href
  )
    return;
  const message = dirtyForms.values().next().value;
  if (message && !window.confirm(message)) {
    event.preventDefault();
    event.stopPropagation();
  }
}
export function useUnsaved(dirty: boolean, message: string) {
  useEffect(() => {
    if (!dirty) return;
    const id = Symbol();
    if (!dirtyForms.size) {
      window.addEventListener("beforeunload", unload);
      document.addEventListener("click", navigate, true);
    }
    dirtyForms.set(id, message);
    return () => {
      dirtyForms.delete(id);
      if (!dirtyForms.size) {
        window.removeEventListener("beforeunload", unload);
        document.removeEventListener("click", navigate, true);
      }
    };
  }, [dirty, message]);
}
export function serializeDraft(value: unknown) {
  return JSON.stringify(value, (_key, item) =>
    typeof File !== "undefined" && item instanceof File
      ? {
          name: item.name,
          size: item.size,
          lastModified: item.lastModified,
          type: item.type,
        }
      : item,
  );
}
export function useDraftGuard(value: unknown, message: string) {
  const serialized = serializeDraft(value);
  const [baseline, setBaseline] = useState(() => serialized);
  useUnsaved(serialized !== baseline, message);
  return () => setBaseline(serialized);
}
