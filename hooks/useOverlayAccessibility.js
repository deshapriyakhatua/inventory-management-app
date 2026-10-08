"use client";

import { useEffect, useEffectEvent, useRef } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

// Open overlays, innermost last; only the topmost handles Escape and the focus trap.
const overlayStack = [];

export default function useOverlayAccessibility({
  open,
  onClose,
  dialogRef,
  triggerRef,
}) {
  const requestClose = useEffectEvent(() => onClose?.());

  useEffect(() => {
    if (!open || !dialogRef.current) return undefined;

    const dialog = dialogRef.current;
    const token = {};
    overlayStack.push(token);
    const restoreTarget = triggerRef?.current || document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const focusables = () => [...dialog.querySelectorAll(focusableSelector)];
    const initialFocus = dialog.querySelector("[data-autofocus]") || focusables()[0] || dialog;
    initialFocus.focus({ preventScroll: true });

    function handleKeyDown(event) {
      if (overlayStack[overlayStack.length - 1] !== token) return;

      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      overlayStack.splice(overlayStack.indexOf(token), 1);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      if (restoreTarget instanceof HTMLElement && restoreTarget.isConnected) {
        restoreTarget.focus({ preventScroll: true });
      }
    };
  }, [open, dialogRef, triggerRef]);
}