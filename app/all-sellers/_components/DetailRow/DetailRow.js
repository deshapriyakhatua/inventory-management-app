import Icon from "@/components/ui/Icon/Icon";
import styles from "./DetailRow.module.css";

/* ── Detail Row ──────────────────────────────────────── */
export default function DetailRow({ icon, label, value, onCopy }) {
  if (!value) return null;
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon}>{icon}</span>
      <div className={styles.detailContent}>
        <span className={styles.detailLabel}>{label}</span>
        <span className={styles.detailValue}>{value}</span>
      </div>
      {onCopy && (
        <button className={styles.copyIconBtn} onClick={onCopy} title="Copy">
          <Icon name="copy-inventory-id" size={13} />
        </button>
      )}
    </div>
  );
}
