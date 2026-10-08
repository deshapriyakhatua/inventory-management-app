import styles from "./TableShell.module.css";

export default function TableShell({ children }) {
  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          {children}
        </table>
      </div>
    </div>
  );
}
