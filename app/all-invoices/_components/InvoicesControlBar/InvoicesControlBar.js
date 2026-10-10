import Icon from "@/components/ui/Icon/Icon";
import styles from "./InvoicesControlBar.module.css";

export default function InvoicesControlBar({
  showArchived,
  onShowActive,
  onShowArchived,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  loading,
}) {
  return (
    <div className={styles.controlBar}>
      <div className={styles.tabGroup}>
        <button
          type="button"
          className={`${styles.tabItem} ${!showArchived ? styles.activeTabItem : ""}`}
          onClick={onShowActive}
        >
          Active Invoices
        </button>
        <button
          type="button"
          className={`${styles.tabItem} ${showArchived ? styles.activeTabItem : ""}`}
          onClick={onShowArchived}
        >
          Archived Invoices 🗑️
        </button>
      </div>

      <div className={styles.searchBox}>
        <Icon name="icon-9c4a10ac" size={18} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search Invoice #, Customer Name, SKU..."
          value={search}
          onChange={onSearchChange}
        />
      </div>

      <div className={styles.filterGroup}>
        <select
          className={styles.statusSelect}
          value={statusFilter}
          onChange={onStatusFilterChange}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          type="button"
          className={styles.refreshBtn}
          onClick={onRefresh}
          disabled={loading}
        >
          <Icon name="refresh" size={16} />
          Refresh
        </button>
      </div>
    </div>
  );
}
