"use client";

import { Button, Badge, Icon, Modal } from "@/components/ui";
import styles from "./ConfirmModal.module.css";

const toneMap = {
  danger: "danger",
  warning: "warning",
  info: "info",
};

const iconMap = {
  danger: "trash",
  warning: "icon-cfd589e1",
  info: "icon-fe5d7d4f",
};

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}) {
  const tone = toneMap[variant] || "danger";
  const iconName = iconMap[tone] || "trash";

  return (
    <Modal
      open={isOpen}
      onClose={isLoading ? undefined : onClose}
      title={title}
      size="sm"
      closeOnScrim={!isLoading}
    >
      <div className={styles.content}>
        <div className={styles.summary}>
          <Badge tone={tone} className={styles.iconBadge}>
            <Icon name={iconName} size={18} />
          </Badge>
        </div>
        <p className={styles.message}>{message}</p>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={tone === "danger" ? "danger" : "primary"}
          size="md"
          loading={isLoading}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
