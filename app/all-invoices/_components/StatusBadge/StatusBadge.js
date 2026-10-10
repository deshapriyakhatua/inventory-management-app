import styles from "./StatusBadge.module.css";

// Shared by the invoices table row and the graphical view modal header.
export default function StatusBadge({ status }) {
  return (
    <span
      className={`${styles.statusBadge} ${
        status === "Paid"
          ? styles.statusPaid
          : status === "Pending"
          ? styles.statusPending
          : status === "Partially Paid"
          ? styles.statusPartial
          : styles.statusCancelled
      }`}
    >
      {status}
    </span>
  );
}
