import styles from "./FormCard.module.css";

// Shared wrapper for the four form cards (header info, party details,
// line items, tax summary). Hidden by the page's @media print rules.
export default function FormCard({ children }) {
  return <div className={styles.card}>{children}</div>;
}
