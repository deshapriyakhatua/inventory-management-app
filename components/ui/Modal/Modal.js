"use client";

import { useEffect, useId, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { spring, useMotionPreference } from "@/lib/motion";
import IconButton from "../IconButton/IconButton";
import cx from "../cx";
import useOverlayAccessibility from "@/hooks/useOverlayAccessibility";
import styles from "./Modal.module.css";

const sizes = ["sm", "md", "lg", "xl", "auto"];
const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Modal({
  open,
  onClose,
  title,
  description,
  ariaLabel,
  closeLabel = "Close dialog",
  closeOnScrim = true,
  size = "md",
  triggerRef,
  className,
  children,
}) {
  const portalReady = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const { reducedMotion, transition } = useMotionPreference();
  const resolvedSize = sizes.includes(size) ? size : "md";

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) return;
    if (size === "auto" && window.matchMedia("(max-width: 768px)").matches) {
      dialog.style.setProperty("--modal-transform-origin", "50% 100%");
      return;
    }
    const trigger = triggerRef?.current;
    if (!portalReady || !trigger) {
      dialog.style.removeProperty("--modal-transform-origin");
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    dialog.style.setProperty(
      "--modal-transform-origin",
      `${triggerRect.left + triggerRect.width / 2 - dialogRect.left}px ${triggerRect.top + triggerRect.height / 2 - dialogRect.top}px`,
    );
  }, [open, portalReady, size, triggerRef]);

  useOverlayAccessibility({
    open: Boolean(open && portalReady),
    onClose,
    dialogRef,
    triggerRef,
  });

  const dialogVariants = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, scale: 0.96, filter: "blur(16px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.96, filter: "blur(16px)" },
      };

  if (!portalReady) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={styles.overlay} data-size={resolvedSize}>
          <motion.div
            className={styles.scrim}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.2 }}
            onClick={(event) => {
              if (closeOnScrim && event.target === event.currentTarget) onClose?.();
            }}
          />
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            aria-label={!title ? ariaLabel || "Dialog" : undefined}
            tabIndex={-1}
            className={cx(styles.panel, styles[`size${resolvedSize[0].toUpperCase()}${resolvedSize.slice(1)}`], className)}
            variants={dialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            {(title || description || onClose) && (
              <header className={styles.header}>
                <div className={styles.heading}>
                  {title && <h2 id={titleId} className={styles.title}>{title}</h2>}
                  {description && <p id={descriptionId} className={styles.description}>{description}</p>}
                </div>
                {onClose && (
                  <IconButton
                    name="remove-this-product"
                    size="sm"
                    aria-label={closeLabel}
                    onClick={onClose}
                  />
                )}
              </header>
            )}
            <div className={styles.body}>{children}</div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}