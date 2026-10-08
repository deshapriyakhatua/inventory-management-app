import Button from "@/components/ui/Button/Button";
import cx from "@/components/ui/cx";
import FormField from "@/components/ui/FormField/FormField";
import Icon from "@/components/ui/Icon/Icon";
import Input from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal/Modal";
import styles from "./ConfirmModal.module.css";

// One component for the three typed-confirmation dialogs (archive / restore / permanent delete).
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
  const toneClass = isArchive ? styles.toneWarning : isRestore ? styles.toneInfo : styles.toneDanger;

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={
        <span className={cx(styles.title, toneClass)}>
          <Icon name={isArchive ? "archive-this-record" : isRestore ? "restore-invoice" : "delete-permanently"} size={22} />
          {isArchive ? "Archive Purchase Record" : isRestore ? "Restore Purchase Record" : "Delete Permanently"}
        </span>
      }
    >
      <div className={styles.root}>
        <p className={styles.message}>
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
              This will <strong className={styles.emphasisDanger}>permanently</strong> remove the purchase record for <strong>{target.inventoryId}</strong>. This action cannot be undone.
            </>
          )}
        </p>

        <FormField
          error={error}
          label={isDelete
            ? "Enter your login PIN to confirm"
            : <>Type <strong className={cx(styles.keyword, toneClass)}>{kind}</strong> to confirm</>}
        >
          <Input
            ref={inputRef}
            type={isDelete ? "password" : "text"}
            inputMode={isDelete ? "numeric" : undefined}
            maxLength={isDelete ? 6 : undefined}
            placeholder={isArchive ? "Type 'archive' here..." : isRestore ? "Type 'restore' here..." : "Enter your PIN..."}
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onInputKeyDown}
            data-autofocus
          />
        </FormField>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={isBusy}>Cancel</Button>
          <Button
            variant={isDelete ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={confirmDisabled}
            loading={isBusy}
          >
            {isArchive
              ? (isBusy ? "Archiving..." : "Archive Record")
              : isRestore
                ? (isBusy ? "Restoring..." : "Restore Record")
                : (isBusy ? "Deleting..." : "Delete Permanently")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
