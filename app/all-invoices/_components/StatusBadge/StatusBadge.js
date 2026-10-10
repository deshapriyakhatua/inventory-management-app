import Badge from "@/components/ui/Badge/Badge";
import styles from "./StatusBadge.module.css";

// Shared by the invoices table row and the graphical view modal header.
// Tone comes from Badge's paymentStatus mapping (Paid success, Pending / Partially Paid warning, Cancelled neutral).
export default function StatusBadge({ status }) {
  return (
    <Badge status={status} className={styles.root}>
      <span aria-hidden="true" className={styles.dot} />
      {status}
    </Badge>
  );
}
