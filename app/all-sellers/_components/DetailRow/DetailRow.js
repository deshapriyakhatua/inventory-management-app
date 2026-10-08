import IconButton from "@/components/ui/IconButton/IconButton";
import styles from "./DetailRow.module.css";

/* ── Detail Row ──────────────────────────────────────── */
export default function DetailRow({ icon, label, value, onCopy }) {
  if (!value) return null;
  return (
    <div className={styles.root}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </div>
      {onCopy && (
        <IconButton
          name="copy-inventory-id"
          size="sm"
          className={styles.copy}
          onClick={onCopy}
          title="Copy"
          aria-label={`Copy ${label}`}
        />
      )}
    </div>
  );
}
