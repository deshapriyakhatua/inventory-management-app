import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
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
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <PageHeader
      title={
        <span className={styles.title}>
          All Sellers
          <Badge tone="accent" className={styles.count}>{totalItems}</Badge>
        </span>
      }
      actions={
        <div className={styles.root}>
          <div className={styles.search}>
            <Input
              type="text"
              aria-label="Search by name, GST, phone, email..."
              placeholder="Search by name, GST, phone, email..."
              value={searchQuery}
              onChange={onSearchChange}
              leading={<Icon name="icon-9c4a10ac" size={16} className={styles.searchIcon} />}
              trailing={
                searchQuery && (
                  <IconButton
                    name="remove-this-product"
                    size="sm"
                    aria-label="Clear search"
                    title="Clear search"
                    className={styles.clearButton}
                    onClick={onClearSearch}
                  />
                )
              }
            />
          </div>

          <IconButton
            name="refresh"
            variant="secondary"
            onClick={onRefresh}
            loading={refreshing}
            title="Refresh"
            aria-label="Refresh"
          />

          {/* Admin Toggle For Archived */}
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
