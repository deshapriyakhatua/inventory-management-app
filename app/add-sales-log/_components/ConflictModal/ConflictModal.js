import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import Modal from "@/components/ui/Modal/Modal";
import styles from "./ConflictModal.module.css";
import { MONTHS } from "../../addSalesLogConfig";
import ConflictItem from "../ConflictItem/ConflictItem";

export default function ConflictModal({
  open,
  conflicts,
  conflictDecisions,
  month,
  year,
  onClose,
  onDecisionChange,
  onConfirm,
}) {
  const decisionValues = Object.values(conflictDecisions);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel="Close modal"
      size="xl"
      title={
        <span className={styles.title}>
          <span className={styles.warningIcon}>
            <Icon name="icon-cfd589e1" />
          </span>
          Duplicate Records Detected
        </span>
      }
      description={
        <>
          {conflicts.length} record(s) already exist for {MONTHS[month - 1]} {year}. Compare old vs. new data and choose to <strong>Override</strong>, <strong>Keep Both</strong>, or <strong>Skip</strong>.
        </>
      }
    >
      {/* Conflict list */}
      <div className={styles.list}>
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
      <div className={styles.footer}>
        <div className={styles.footerInfo}>
          {decisionValues.filter((v) => v === "override").length} override ·{" "}
          {decisionValues.filter((v) => v === "keep").length} keep both ·{" "}
          {decisionValues.filter((v) => v === "skip").length} skip
        </div>
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm Decisions
          </Button>
        </div>
      </div>
    </Modal>
  );
}
