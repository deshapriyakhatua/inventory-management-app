import Icon from "@/components/ui/Icon/Icon";
import ExcelExportButton from "../ExcelExportButton/ExcelExportButton";
import styles from "./PurchaseToolbar.module.css";

export default function PurchaseToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  showExpandToggle,
  allExpanded,
  onToggleExpandAll,
  onExport,
  showArchived,
  onToggleShowArchived,
  onRefresh,
}) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>Purchase History</h1>
        <p className={styles.subtitle}>A complete log of all inbound stock and procurement expenses.</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Icon name="icon-9c4a10ac" size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search SKU, Invoice, Seller..."
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>

        <select className={styles.filterSelect} value={statusFilter} onChange={onStatusFilterChange}>
          <option value="All">All Status</option>
          <option value="Delivered">Delivered</option>
          <option value="In-Transit">In-Transit</option>
        </select>

        {/* View Mode Toggle: Grouped vs Flat */}
        <div className={styles.viewToggleGroup}>
          <button
            className={`${styles.viewToggleBtn} ${viewMode === "grouped" ? styles.viewToggleActive : ""}`}
            onClick={() => onViewModeChange("grouped")}
            title="Group by Seller & Invoice"
          >
            <Icon name="payment-qr-balance" size={14} />
            Grouped
          </button>
          <button
            className={`${styles.viewToggleBtn} ${viewMode === "flat" ? styles.viewToggleActive : ""}`}
            onClick={() => onViewModeChange("flat")}
            title="Flat List View"
          >
            <Icon name="icon-5d77ebc6" size={14} />
            Flat List
          </button>
        </div>

        {/* Expand/Collapse All (Grouped Mode) */}
        {showExpandToggle && (
          <button
            className={styles.actionSecondaryBtn}
            onClick={onToggleExpandAll}
            title={allExpanded ? "Collapse All Groups" : "Expand All Groups"}
          >
            <Icon name="icon-89725ea1" size={14} />
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
        )}

        <ExcelExportButton onClick={onExport} />

        <button
          className={`${styles.showArchivedBtn} ${showArchived ? styles.showArchivedActive : ""}`}
          onClick={onToggleShowArchived}
          title={showArchived ? "Hide archived records" : "Show archived records"}
        >
          <Icon name="archive-this-record" size={15} />
          {showArchived ? "Hide Archived" : "Show Archived"}
        </button>

        <button className={styles.refreshBtn} onClick={onRefresh} title="Refresh Data">
          <Icon name="refresh-data" />
        </button>
      </div>
    </div>
  );
}
