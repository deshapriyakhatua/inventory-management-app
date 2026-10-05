import Icon from "@/components/ui/Icon/Icon";
import styles from "./InventoryToolbar.module.css";

export default function InventoryToolbar({
    user,
    verticals,
    searchQuery,
    onSearchQueryChange,
    onSearch,
    selectedVertical,
    onVerticalChange,
    sortOrder,
    onSortOrderChange,
    onReset,
    refreshing,
    onRefresh,
    showArchived,
    onToggleArchived,
}) {
    return (
        <div className={styles.header}>
            <h1 className={styles.title}>All Inventory</h1>

            <div className={styles.controlsRow}>
                <div className={styles.filtersGroup}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Search Inventory ID..."
                            value={searchQuery}
                            onChange={onSearchQueryChange}
                            onKeyDown={onSearch}
                            className={styles.searchInput}
                        />
                        <button className={styles.searchBtn} onClick={onSearch} title="Search">
                            <Icon name="icon-9c4a10ac" size={18} />
                        </button>
                    </div>

                    <select
                        className={styles.filterSelect}
                        value={selectedVertical}
                        onChange={onVerticalChange}
                    >
                        <option value="">All Verticals</option>
                        {verticals.map(v => (
                            <option key={v.verticalShort} value={v.verticalName}>{v.verticalName}</option>
                        ))}
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={sortOrder}
                        onChange={onSortOrderChange}
                    >
                        <option value="newest_first">Newest First</option>
                        <option value="oldest_first">Oldest First</option>
                    </select>

                    <button
                        className={styles.resetBtn}
                        onClick={onReset}
                        title="Reset Filters"
                    >
                        <Icon name="reset-filters" size={18} />
                        Reset
                    </button>

                    <button
                        className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ''}`}
                        onClick={onRefresh}
                        disabled={refreshing}
                        title="Refresh Data"
                    >
                        <Icon name="refresh" size={18} />
                        Refresh
                    </button>

                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                        <button
                            className={`${styles.refreshBtn} ${showArchived ? styles.activeView : ''}`}
                            onClick={onToggleArchived}
                            title={showArchived ? "Hide Archived" : "Show Archived"}
                            style={showArchived ? { backgroundColor: 'var(--accent-color, #3b82f6)', color: 'white', borderColor: 'var(--accent-color, #3b82f6)' } : {}}
                        >
                            <Icon name="icon-fb9fc010" size={18} />
                            {showArchived ? "Hide Archived" : "Show Archived"}
                        </button>
                    )}
                </div>


            </div>
        </div>
    );
}
