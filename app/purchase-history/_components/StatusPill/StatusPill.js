import styles from "./StatusPill.module.css";

// tone: "received" | "partial" | "pending"
export default function StatusPill({ tone, children }) {
  return (
    <span className={`${styles.status} ${styles[tone]}`}>
      <span className={styles.dot}></span>
      {children}
    </span>
  );
}
