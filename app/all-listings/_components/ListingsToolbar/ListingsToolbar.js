import Icon from "@/components/ui/Icon/Icon";
import styles from "./ListingsToolbar.module.css";

export default function ListingsToolbar({
    searchQuery,
    inventoryIdQuery,
    styleIdQuery,
    selectedVertical,
    selectedMarketplace,
    selectedStatus,
    sortOrder,
    verticals,
    refreshing,
    totalItems,
    onSearchQueryChange,
    onSearch,
    onInventoryIdQueryChange,
    onStyleIdQueryChange,
    onSearchClick,
    onRefresh,
    onDownload,
    onVerticalChange,
    onMarketplaceChange,
    onStatusChange,
    onSortOrderChange,
    onReset,
}) {
    return (
        <div className={styles.header}>
            <h1 className={styles.title}>SKU</h1>

            <div className={styles.controlsRow}>
                {/* Row 1: Search Inputs & Refresh Button */}
                <div className={styles.controlsGroup}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Search SKU ID..."
                            value={searchQuery}
                            onChange={onSearchQueryChange}
                            onKeyDown={onSearch}
                            className={styles.searchInput}
                        />
                        <button className={styles.searchBtn} onClick={onSearch} title="Search">
                            <Icon name="icon-9c4a10ac" size={15} />
                        </button>
                    </div>

                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Search Inventory ID..."
                            value={inventoryIdQuery}
                            onChange={onInventoryIdQueryChange}
                            className={styles.searchInput}
                        />
                        <button className={styles.searchBtn} onClick={onSearchClick} title="Search">
                            <Icon name="icon-9c4a10ac" size={15} />
                        </button>
                    </div>

                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Search Style ID..."
                            value={styleIdQuery}
                            onChange={onStyleIdQueryChange}
                            className={styles.searchInput}
                        />
                        <button className={styles.searchBtn} onClick={onSearchClick} title="Search Style ID">
                            <Icon name="icon-9c4a10ac" size={15} />
                        </button>
                    </div>

                    <button
                        className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ''}`}
                        onClick={onRefresh}
                        disabled={refreshing}
                        title="Refresh Data"
                    >
                        <Icon name="refresh" size={15} />
                        Refresh
                    </button>

                    <button
                        className={styles.downloadBtn}
                        onClick={onDownload}
                        disabled={totalItems === 0}
                        title={`Download all ${totalItems} filtered SKUs as Excel`}
                    >
                        <Icon name="download-invoices-excel-report" size={15} />
                        Download
                    </button>
                </div>

                {/* Row 2: Filter Selects & Reset Button */}
                <div className={styles.controlsGroup}>
                    <select
                        className={styles.filterSelect}
                        value={selectedVertical}
                        onChange={onVerticalChange}
                    >
                        <option value="">All Verticals</option>
                        {verticals.map(v => (
                            <option key={v.verticalShort} value={v.verticalName}>{v.verticalName}</option>
                        ))}
                        <option key="combo" value="Combo">Combo</option>
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={selectedMarketplace}
                        onChange={onMarketplaceChange}
                    >
                        <option value="">All Marketplaces</option>
                        <option value="Amazon">Amazon</option>
                        <option value="Flipkart">Flipkart</option>
                        <option value="Shopsy">Shopsy</option>
                        <option value="Myntra">Myntra</option>
                        <option value="Meesho">Meesho</option>
                        <option value="Ajio">Ajio</option>
                        <option value="Website">Website</option>
                        <option value="Other">Other</option>
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={selectedStatus}
                        onChange={onStatusChange}
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="blocked">Blocked</option>
                        <option value="archived">Archived</option>
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
                        <Icon name="reset-filters-listings" size={15} />
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}
