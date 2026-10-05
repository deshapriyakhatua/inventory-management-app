import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import Select from "@/components/ui/Select/Select";
import styles from "./ListingsToolbar.module.css";

function SearchInput({ placeholder, value, onChange, onKeyDown, onSearch, searchLabel }) {
    return (
        <div className={styles.search}>
            <Input
                type="text"
                aria-label={placeholder}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                leading={
                    <IconButton
                        name="icon-9c4a10ac"
                        size="sm"
                        aria-label={searchLabel}
                        title={searchLabel}
                        className={styles.searchButton}
                        onClick={onSearch}
                    />
                }
            />
        </div>
    );
}

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
        <>
            <PageHeader
                title="SKU"
                actions={
                    <div className={styles.root}>
                        <SearchInput
                            placeholder="Search SKU ID..."
                            value={searchQuery}
                            onChange={onSearchQueryChange}
                            onKeyDown={onSearch}
                            onSearch={onSearch}
                            searchLabel="Search"
                        />
                        <SearchInput
                            placeholder="Search Inventory ID..."
                            value={inventoryIdQuery}
                            onChange={onInventoryIdQueryChange}
                            onSearch={onSearchClick}
                            searchLabel="Search"
                        />
                        <SearchInput
                            placeholder="Search Style ID..."
                            value={styleIdQuery}
                            onChange={onStyleIdQueryChange}
                            onSearch={onSearchClick}
                            searchLabel="Search Style ID"
                        />

                        <IconButton
                            name="refresh"
                            variant="secondary"
                            onClick={onRefresh}
                            loading={refreshing}
                            title="Refresh Data"
                            aria-label="Refresh Data"
                        />

                        <Button
                            variant="secondary"
                            leftIcon={<Icon name="download-invoices-excel-report" size={16} />}
                            onClick={onDownload}
                            disabled={totalItems === 0}
                            title={`Download all ${totalItems} filtered SKUs as Excel`}
                        >
                            Download
                        </Button>
                    </div>
                }
            />

            <div className={styles.filters}>
                <div className={styles.filter}>
                    <Select aria-label="Vertical" value={selectedVertical} onChange={onVerticalChange}>
                        <option value="">All Verticals</option>
                        {verticals.map(v => (
                            <option key={v.verticalShort} value={v.verticalName}>{v.verticalName}</option>
                        ))}
                        <option key="combo" value="Combo">Combo</option>
                    </Select>
                </div>

                <div className={styles.filter}>
                    <Select aria-label="Marketplace" value={selectedMarketplace} onChange={onMarketplaceChange}>
                        <option value="">All Marketplaces</option>
                        <option value="Amazon">Amazon</option>
                        <option value="Flipkart">Flipkart</option>
                        <option value="Shopsy">Shopsy</option>
                        <option value="Myntra">Myntra</option>
                        <option value="Meesho">Meesho</option>
                        <option value="Ajio">Ajio</option>
                        <option value="Website">Website</option>
                        <option value="Other">Other</option>
                    </Select>
                </div>

                <div className={styles.filter}>
                    <Select aria-label="Status" value={selectedStatus} onChange={onStatusChange}>
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="blocked">Blocked</option>
                        <option value="archived">Archived</option>
                    </Select>
                </div>

                <div className={styles.filter}>
                    <Select aria-label="Sort order" value={sortOrder} onChange={onSortOrderChange}>
                        <option value="newest_first">Newest First</option>
                        <option value="oldest_first">Oldest First</option>
                    </Select>
                </div>

                <Button
                    variant="secondary"
                    leftIcon={<Icon name="reset-filters-listings" size={16} />}
                    onClick={onReset}
                    title="Reset Filters"
                >
                    Reset
                </Button>
            </div>
        </>
    );
}
