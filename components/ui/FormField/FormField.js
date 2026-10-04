"use client";

import { cloneElement, isValidElement, useId } from "react";
import styles from "./FormField.module.css";
import cx from "../cx";

export default function FormField({
  label,
  hint,
  error,
  required = false,
  id,
  className,
  children,
}) {
  const generatedId = useId();
  const child = isValidElement(children) ? children : null;
  const controlId = id || child?.props.id || generatedId;
  const isRequired = required || Boolean(child?.props.required);
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [child?.props["aria-describedby"], hintId, errorId]
    .filter(Boolean)
    .join(" ") || undefined;
  const control = child
    ? cloneElement(child, {
        id: controlId,
        required: isRequired || undefined,
        "aria-invalid": error ? true : child.props["aria-invalid"],
        "aria-describedby": describedBy,
      })
    : children;

  return (
    <div className={cx(styles.root, className)}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
        {isRequired && <span aria-hidden="true" className={styles.required}>*</span>}
      </label>
      {control}
      {hint && <span id={hintId} className={styles.hint}>{hint}</span>}
      {error && <span id={errorId} className={styles.error} role="alert">{error}</span>}
    </div>
  );
}