"use client";
import { useEffect, type RefObject } from "react";
export function useModalFocus(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  close: () => void,
  locked = false,
) {
  useEffect(() => {
    if (!open || !ref.current) return;
    const container = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const selector =
      'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]';
    const items = () =>
      [...container.querySelectorAll<HTMLElement>(selector)].filter(
        (item) => !item.hidden,
      );
    (items()[0] ?? container).focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !locked) {
        event.preventDefault();
        close();
      }
      if (event.key === "Tab") {
        const focusable = items();
        const first = focusable[0],
          last = focusable.at(-1);
        if (!first) {
          event.preventDefault();
          container.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            !container.contains(document.activeElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !container.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [open, ref, close, locked]);
}
