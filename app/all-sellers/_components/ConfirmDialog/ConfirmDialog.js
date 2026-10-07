import Icon from "@/components/ui/Icon/Icon";
import styles from "./ConfirmDialog.module.css";

/* Shared by the Archive and Restore confirmations. */
export default function ConfirmDialog({
  variant,
  iconName,
  iconStyle,
  title,
  message,
  confirmLabel,
  loadingLabel,
  loading,
  onCancel,
  onConfirm,
}) {
  const confirmClassName = variant === "restore" ? styles.confirmRestoreBtn : styles.confirmDeleteBtn;

  return (
    <div className={styles.confirmOverlay} onClick={onCancel}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmIcon} style={iconStyle}>
          <Icon name={iconName} size={28} />
        </div>
        <h3 className={styles.confirmTitle}>{title}</h3>
        <p className={styles.confirmMsg}>{message}</p>
        <div className={styles.confirmActions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={confirmClassName} onClick={onConfirm} disabled={loading}>
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
