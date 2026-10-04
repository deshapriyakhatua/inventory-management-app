"use client";

import { useId, useRef } from "react";
import { motion } from "motion/react";
import { spring, useMotionPreference } from "@/lib/motion";
import cx from "../cx";
import styles from "./SegmentedControl.module.css";

function normalizeOption(option) {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export default function SegmentedControl({
  options = [],
  value,
  onValueChange,
  "aria-label": ariaLabel = "View options",
  className,
  ...rest
}) {
  const indicatorId = useId();
  const refs = useRef([]);
  const { reducedMotion } = useMotionPreference();
  const items = options.map(normalizeOption);
  const selectedIndex = items.findIndex((item) => item.value === value);
  const firstEnabledIndex = Math.max(0, items.findIndex((item) => !item.disabled));

  function moveFocus(index, event) {
    const key = event.key;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)) return;
    event.preventDefault();

    let nextIndex = key === "Home" ? 0 : key === "End" ? items.length - 1 : index;
    if (key === "ArrowLeft" || key === "ArrowUp") nextIndex = (index - 1 + items.length) % items.length;
    if (key === "ArrowRight" || key === "ArrowDown") nextIndex = (index + 1) % items.length;

    for (let tries = 0; tries < items.length && items[nextIndex]?.disabled; tries += 1) {
      nextIndex = (nextIndex + (key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
    }
    const next = items[nextIndex];
    if (!next || next.disabled) return;
    refs.current[nextIndex]?.focus();
    onValueChange?.(next.value);
  }

  return (
    <div {...rest} role="radiogroup" aria-label={ariaLabel} className={cx(styles.root, className)}>
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(element) => { refs.current[index] = element; }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={item.disabled}
            tabIndex={selected || (selectedIndex === -1 && index === firstEnabledIndex) ? 0 : -1}
            className={cx(styles.option, selected && styles.selected)}
            onClick={() => onValueChange?.(item.value)}
            onKeyDown={(event) => moveFocus(index, event)}
          >
            {selected && (reducedMotion
              ? <span aria-hidden="true" className={styles.indicator} />
              : <motion.span aria-hidden="true" layoutId={indicatorId} transition={spring.snappy} className={styles.indicator} />)}
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}