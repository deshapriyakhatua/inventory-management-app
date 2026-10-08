import Icon from "@/components/ui/Icon/Icon";
import styles from "./ConflictModal.module.css";
import { MONTHS } from "../../addSalesLogConfig";
import ConflictItem from "../ConflictItem/ConflictItem";

export default function ConflictModal({
  conflicts,
  conflictDecisions,
  month,
  year,
  onClose,
  onDecisionChange,
  onConfirm,
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <div className={styles.modalWarningIcon}>
              <Icon name="icon-cfd589e1" />
            </div>
            Duplicate Records Detected
          </div>
          <button
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icon name="remove-this-product" size={18} />
          </button>
        </div>
        <p className={styles.modalSubtitle}>
          {conflicts.length} record(s) already exist for {MONTHS[month - 1]} {year}. Compare old vs. new data and choose to <strong>Override</strong>, <strong>Keep Both</strong>, or <strong>Skip</strong>.
        </p>

        {/* Conflict list */}
        <div className={styles.conflictList}>
          {conflicts.map((conflict, indx) => (
            <ConflictItem
              key={`${conflict.key}-conflict-item-${indx}`}
              conflict={conflict}
              decision={conflictDecisions[conflict.key]}
              month={month}
              year={year}
              onDecisionChange={onDecisionChange}
            />
          ))}
        </div>

        {/* Modal footer */}
        <div className={styles.modalFooter}>
          <div className={styles.modalFooterInfo}>
            {Object.values(conflictDecisions).filter((v) => v === "override").length} override ·{" "}
            {Object.values(conflictDecisions).filter((v) => v === "keep").length} keep both ·{" "}
            {Object.values(conflictDecisions).filter((v) => v === "skip").length} skip
          </div>
          <div className={styles.modalFooterActions}>
            <button className={styles.modalCancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.modalConfirmBtn} onClick={onConfirm}>
              Confirm Decisions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
