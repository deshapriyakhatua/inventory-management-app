import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import Select from "@/components/ui/Select/Select";
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
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    return (
        <PageHeader
            title="All Inventory"
            actions={
                <div className={styles.root}>
                    <div className={styles.search}>
                        <Input
                            type="text"
                            aria-label="Search Inventory ID..."
                            placeholder="Search Inventory ID..."
                            value={searchQuery}
                            onChange={onSearchQueryChange}
                            onKeyDown={onSearch}
                            leading={
                                <IconButton
                                    name="icon-9c4a10ac"
                                    size="sm"
                                    aria-label="Search"
                                    title="Search"
                                    className={styles.searchButton}
                                    onClick={onSearch}
                                />
                            }
                        />
                    </div>

                    <div className={styles.filter}>
                        <Select aria-label="Vertical" value={selectedVertical} onChange={onVerticalChange}>
                            <option value="">All Verticals</option>
                            {verticals.map(v => (
                                <option key={v.verticalShort} value={v.verticalName}>{v.verticalName}</option>
                            ))}
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
                        leftIcon={<Icon name="reset-filters" size={16} />}
                        onClick={onReset}
                        title="Reset Filters"
                    >
                        Reset
                    </Button>

                    <IconButton
                        name="refresh"
                        variant="secondary"
                        onClick={onRefresh}
                        loading={refreshing}
                        title="Refresh Data"
                        aria-label="Refresh Data"
                    />

                    {isAdmin && (
                        <Button
                            variant="secondary"
                            leftIcon={<Icon name="icon-fb9fc010" size={16} />}
                            onClick={onToggleArchived}
                            aria-pressed={showArchived}
                            title={showArchived ? "Hide Archived" : "Show Archived"}
                        >
                            {showArchived ? "Hide Archived" : "Show Archived"}
                        </Button>
                    )}
                </div>
            }
        />
    );
}
