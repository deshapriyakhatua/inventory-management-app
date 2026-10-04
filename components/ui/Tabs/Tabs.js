"use client";

import { useId, useRef } from "react";
import { motion } from "motion/react";
import { spring, useMotionPreference } from "@/lib/motion";
import cx from "../cx";
import styles from "./Tabs.module.css";

function normalizeItem(item) {
  return typeof item === "string" ? { value: item, label: item } : item;
}

export default function Tabs({
  items = [],
  value,
  onValueChange,
  "aria-label": ariaLabel = "Tabs",
  className,
  ...rest
}) {
  const indicatorId = useId();
  const refs = useRef([]);
  const { reducedMotion } = useMotionPreference();
  const options = items.map(normalizeItem);
  const selectedIndex = Math.max(0, options.findIndex((item) => item.value === value));
  const firstEnabledIndex = Math.max(0, options.findIndex((item) => !item.disabled));
  const focusIndex = value == null ? firstEnabledIndex : selectedIndex;

  function moveFocus(index, event) {
    const key = event.key;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)) return;
    event.preventDefault();

    let nextIndex = key === "Home" ? 0 : key === "End" ? options.length - 1 : index;
    if (key === "ArrowLeft" || key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
    if (key === "ArrowRight" || key === "ArrowDown") nextIndex = (index + 1) % options.length;

    for (let tries = 0; tries < options.length && options[nextIndex]?.disabled; tries += 1) {
      nextIndex = (nextIndex + (key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1) + options.length) % options.length;
    }
    const next = options[nextIndex];
    if (!next || next.disabled) return;
    refs.current[nextIndex]?.focus();
    onValueChange?.(next.value);
  }

  return (
    <div {...rest} role="tablist" aria-label={ariaLabel} className={cx(styles.root, className)}>
      {options.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(element) => { refs.current[index] = element; }}
            id={item.id || `${indicatorId}-${index}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={item.panelId}
            disabled={item.disabled}
            tabIndex={selected || index === focusIndex ? 0 : -1}
            className={cx(styles.tab, selected && styles.selected)}
            onClick={() => onValueChange?.(item.value)}
            onKeyDown={(event) => moveFocus(index, event)}
          >
            {item.label}
            {selected && (reducedMotion
              ? <span aria-hidden="true" className={styles.indicator} />
              : <motion.span aria-hidden="true" layoutId={indicatorId} transition={spring.snappy} className={styles.indicator} />)}
          </button>
        );
      })}
    </div>
  );
}