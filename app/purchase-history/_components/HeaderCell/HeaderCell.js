import styles from "./HeaderCell.module.css";

export default function HeaderCell({ sortKey, sortConfig, onSort, style, children }) {
  if (sortKey) {
    return (
      <th className={`${styles.th} ${styles.sortable}`} onClick={() => onSort(sortKey)}>
        {children}{" "}
        {sortConfig.key !== sortKey ? (
          <span className={styles.sortPlaceholder}>↕</span>
        ) : (
          <span className={styles.sortActive}>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
        )}
      </th>
    );
  }
  return <th className={styles.th} style={style}>{children}</th>;
}
