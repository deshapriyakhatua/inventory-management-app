"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { spring, useMotionPreference } from "@/lib/motion";
import IconButton from "../IconButton/IconButton";
import cx from "../cx";
import useOverlayAccessibility from "@/hooks/useOverlayAccessibility";
import styles from "./Sheet.module.css";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function project(velocity, decelerationRate = 0.998) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

export default function Sheet({
  open,
  onClose,
  side = "right",
  title,
  description,
  ariaLabel,
  closeLabel = "Close panel",
  closeOnScrim = true,
  triggerRef,
  className,
  children,
}) {
  const portalReady = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
  const dialogRef = useRef(null);
  const [dragReady, setDragReady] = useState(false);
  const [snapBack, setSnapBack] = useState(false);
  const [releaseVelocity, setReleaseVelocity] = useState(0);
  const [exitTransition, setExitTransition] = useState(spring.default);
  const titleId = useId();
  const descriptionId = useId();
  const { reducedMotion } = useMotionPreference();
  const resolvedSide = side === "bottom" ? "bottom" : "right";
  const axis = resolvedSide === "right" ? "x" : "y";
  const viewportExtent = typeof window === "undefined"
    ? 0
    : resolvedSide === "right" ? window.innerWidth : window.innerHeight;
  const dragConstraints = resolvedSide === "right"
    ? { left: 0, right: viewportExtent }
    : { top: 0, bottom: viewportExtent };
  const offset = resolvedSide === "right" ? { x: "100%", y: 0 } : { x: 0, y: "100%" };

  useOverlayAccessibility({
    open: Boolean(open && portalReady),
    onClose,
    dialogRef,
    triggerRef,
  });

  function handleClose() {
    setDragReady(false);
    setExitTransition(spring.default);
    onClose?.();
  }

  function handleDragEnd(_event, info) {
    if (reducedMotion) return;
    const extent = resolvedSide === "right"
      ? dialogRef.current?.getBoundingClientRect().width ?? 0
      : dialogRef.current?.getBoundingClientRect().height ?? 0;
    const projectedOffset = info.offset[axis] + project(info.velocity[axis]);
    const dismissThreshold = Math.max(10, extent * 0.35);

    if (projectedOffset > dismissThreshold || info.velocity[axis] > 700) {
      setDragReady(false);
      setSnapBack(false);
      setExitTransition({
        type: "spring",
        bounce: 0.2,
        duration: 0.3,
        velocity: info.velocity[axis],
      });
      onClose?.();
      return;
    }

    setReleaseVelocity(info.velocity[axis]);
    setSnapBack(true);
  }

  if (!portalReady) return null;

  const initial = reducedMotion
    ? { opacity: 0 }
    : { ...offset, scale: 0.98, filter: "blur(12px)", opacity: 0 };
  const exit = reducedMotion
    ? { opacity: 0 }
    : { ...offset, scale: 0.98, filter: "blur(12px)", opacity: 0 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.scrim}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.2 }}
            onClick={(event) => {
              if (closeOnScrim && event.target === event.currentTarget) handleClose();
            }}
          />
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            aria-label={!title ? ariaLabel || "Panel" : undefined}
            tabIndex={-1}
            className={cx(styles.panel, styles[resolvedSide], className)}
            initial={initial}
            animate={snapBack
              ? { x: 0, y: 0, scale: 1, filter: "blur(0px)", opacity: 1 }
              : reducedMotion
                ? { opacity: 1 }
                : { x: 0, y: 0, scale: 1, filter: "blur(0px)", opacity: 1 }}
            exit={exit}
            transition={snapBack
              ? { ...spring.sheet, velocity: releaseVelocity }
              : reducedMotion ? { duration: 0.15 } : exitTransition}
            drag={reducedMotion || !dragReady ? false : axis}
            dragConstraints={dragReady ? dragConstraints : undefined}
            dragElastic={0.2}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            onAnimationComplete={() => {
              if (open) {
                setDragReady(true);
                setSnapBack(false);
              }
              else {
                setDragReady(false);
                setExitTransition(spring.default);
              }
            }}
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
                    onClick={handleClose}
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