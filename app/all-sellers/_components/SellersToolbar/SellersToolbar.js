import Icon from "@/components/ui/Icon/Icon";
import styles from "./SellersToolbar.module.css";

export default function SellersToolbar({
  user,
  totalItems,
  searchQuery,
  refreshing,
  showArchived,
  onSearchChange,
  onClearSearch,
  onRefresh,
  onToggleArchived,
}) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>All Sellers</h1>
        <span className={styles.countBadge}>{totalItems}</span>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Icon name="icon-9c4a10ac" size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, GST, phone, email..."
            value={searchQuery}
            onChange={onSearchChange}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button className={styles.clearSearch} onClick={onClearSearch}>
              <Icon name="remove-this-product" size={14} />
            </button>
          )}
        </div>

        <button
          className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ""}`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh"
        >
          <Icon name="refresh" size={16} />
          Refresh
        </button>

        {/* Admin Toggle For Archived */}
        {(user?.role === "admin" || user?.role === "superadmin") && (
          <button
            className={styles.refreshBtn}
            onClick={onToggleArchived}
            title={showArchived ? "Hide Archived" : "Show Archived"}
            style={showArchived ? { backgroundColor: "#3b82f6", color: "white", borderColor: "#3b82f6" } : {}}
          >
            <Icon name="icon-fb9fc010" size={16} />
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
        )}
      </div>
    </div>
  );
}
