import Icon from "@/components/ui/Icon/Icon";
import styles from "./ConfirmModal.module.css";

// One component for the three confirm dialogs (archive / restore / permanent delete).
// kind: "archive" | "restore" | "delete"
export default function ConfirmModal({
  kind,
  target,
  inputRef,
  inputValue,
  onInputChange,
  onInputKeyDown,
  error,
  isBusy,
  confirmDisabled,
  onClose,
  onConfirm,
}) {
  const isArchive = kind === "archive";
  const isRestore = kind === "restore";
  const isDelete = kind === "delete";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={isArchive ? styles.dangerModalIcon : `${styles.dangerModalIcon} ${isRestore ? styles.infoBlue : styles.dangerRed}`}>
          <Icon name={isArchive ? "archive-this-record" : isRestore ? "restore-invoice" : "delete-permanently"} size={28} />
        </div>
        <h2 className={styles.modalTitle}>
          {isArchive ? "Archive Purchase Record" : isRestore ? "Restore Purchase Record" : "Delete Permanently"}
        </h2>
        <p className={styles.modalDesc}>
          {isArchive && (
            <>
              You are about to archive the purchase of <strong>{target.inventoryId}</strong> from <strong>{target.sellerId?.businessName || "Unknown"}</strong>.
              <br />Archived records can be viewed and permanently deleted later.
            </>
          )}
          {isRestore && (
            <>
              You are about to restore the purchase of <strong>{target.inventoryId}</strong> from <strong>{target.sellerId?.businessName || "Unknown"}</strong>.
            </>
          )}
          {isDelete && (
            <>
              This will <strong style={{ color: "#ef4444" }}>permanently</strong> remove the purchase record for <strong>{target.inventoryId}</strong>. This action cannot be undone.
            </>
          )}
        </p>
        <div className={styles.formGroup} style={{ marginTop: "1.25rem" }}>
          {isDelete ? (
            <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Enter your login PIN to confirm</label>
          ) : (
            <label style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
              Type <strong style={{ color: isArchive ? "#f59e0b" : "#3b82f6" }}>{kind}</strong> to confirm
            </label>
          )}
          <input
            ref={inputRef}
            type={isDelete ? "password" : "text"}
            inputMode={isDelete ? "numeric" : undefined}
            maxLength={isDelete ? 6 : undefined}
            className={isDelete ? `${styles.confirmInput} ${error ? styles.confirmInputError : ""}` : styles.confirmInput}
            placeholder={isArchive ? "Type 'archive' here..." : isRestore ? "Type 'restore' here..." : "Enter your PIN..."}
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onInputKeyDown}
          />
          {error && <span className={styles.pinError}>{error}</span>}
        </div>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isBusy}>Cancel</button>
          <button
            className={isArchive ? styles.archiveConfirmBtn : isRestore ? styles.restoreConfirmBtn : styles.deleteConfirmBtn}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {isArchive
              ? (isBusy ? "Archiving..." : "Archive Record")
              : isRestore
                ? (isBusy ? "Restoring..." : "Restore Record")
                : (isBusy ? "Deleting..." : "Delete Permanently")}
          </button>
        </div>
      </div>
    </div>
  );
}
