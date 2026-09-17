"use client";

import React, { useEffect } from "react";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // "danger" | "warning" | "info"
  isLoading = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case "warning":
        return "📦";
      case "info":
        return "🔄";
      case "danger":
      default:
        return "⚠️";
    }
  };

  const getBadgeClass = () => {
    switch (variant) {
      case "warning":
        return styles.badgeWarning;
      case "info":
        return styles.badgeInfo;
      case "danger":
      default:
        return styles.badgeDanger;
    }
  };

  const getBtnClass = () => {
    switch (variant) {
      case "warning":
        return styles.btnWarning;
      case "info":
        return styles.btnInfo;
      case "danger":
      default:
        return styles.btnDanger;
    }
  };

  return (
    <div className={styles.overlay} onClick={() => !isLoading && onClose()}>
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.iconHeader}>
          <div className={`${styles.iconBadge} ${getBadgeClass()}`}>
            {getIcon()}
          </div>
          <h3 id="modal-title" className={styles.title}>
            {title}
          </h3>
        </div>

        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${getBtnClass()}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
