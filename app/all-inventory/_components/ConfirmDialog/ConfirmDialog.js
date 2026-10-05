import Icon from "@/components/ui/Icon/Icon";
import styles from "./ConfirmDialog.module.css";

// iconVariant: "warning" -> .warningIcon, "restore" -> .restoreIcon
export default function ConfirmDialog({
    onClose,
    iconVariant = "warning",
    iconStyle,
    iconName,
    title,
    children,
    loading,
    onConfirm,
    confirmStyle,
    confirmLabel,
    loadingLabel,
}) {
    return (
        <div className={styles.confirmOverlay} onClick={onClose}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.confirmHeader}>
                    <div className={iconVariant === "restore" ? styles.restoreIcon : styles.warningIcon} style={iconStyle}>
                        <Icon name={iconName} size={24} />
                    </div>
                    <h3 className={styles.confirmTitle}>{title}</h3>
                </div>
                <p className={styles.confirmMessage}>
                    {children}
                </p>
                <div className={styles.confirmActions}>
                    <button
                        className={styles.cancelBtn}
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.confirmDeleteBtn}
                        style={confirmStyle}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? loadingLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
