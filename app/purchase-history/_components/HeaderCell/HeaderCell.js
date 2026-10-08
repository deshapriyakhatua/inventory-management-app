import Table from "@/components/ui/Table/Table";
import cx from "@/components/ui/cx";
import styles from "./HeaderCell.module.css";

export default function HeaderCell({ sortKey, sortConfig, onSort, numeric = false, className, children }) {
  if (!sortKey) {
    return <Table.Cell as="th" numeric={numeric} className={cx(styles.th, className)}>{children}</Table.Cell>;
  }

  const isActive = sortConfig.key === sortKey;
  const ariaSort = isActive ? (sortConfig.direction === "asc" ? "ascending" : "descending") : undefined;

  return (
    <Table.Cell as="th" numeric={numeric} aria-sort={ariaSort} className={cx(styles.th, className)}>
      <button type="button" className={styles.sortButton} onClick={() => onSort(sortKey)}>
        {children}
        <span aria-hidden="true" className={cx(styles.sortIndicator, isActive && styles.isActive)}>
          {isActive ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </Table.Cell>
  );
}
