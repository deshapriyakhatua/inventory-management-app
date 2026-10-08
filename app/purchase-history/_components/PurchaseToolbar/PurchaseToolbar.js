import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import SegmentedControl from "@/components/ui/SegmentedControl/SegmentedControl";
import Select from "@/components/ui/Select/Select";
import ExcelExportButton from "../ExcelExportButton/ExcelExportButton";
import styles from "./PurchaseToolbar.module.css";

const VIEW_OPTIONS = [
  {
    value: "grouped",
    label: (
      <span className={styles.segment} title="Group by Seller & Invoice">
        <Icon name="payment-qr-balance" size={14} />
        Grouped
      </span>
    ),
  },
  {
    value: "flat",
    label: (
      <span className={styles.segment} title="Flat List View">
        <Icon name="icon-5d77ebc6" size={14} />
        Flat List
      </span>
    ),
  },
];

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
  refreshing,
  onRefresh,
}) {
  return (
    <div className={styles.root}>
      <PageHeader
        title="Purchase History"
        subtitle="A complete log of all inbound stock and procurement expenses."
        actions={
          <>
            <ExcelExportButton onClick={onExport} />
            <IconButton
              name="refresh-data"
              variant="secondary"
              loading={refreshing}
              onClick={onRefresh}
              title="Refresh Data"
              aria-label="Refresh Data"
            />
          </>
        }
      />

      <div className={styles.filters}>
        <div className={styles.search}>
          <Input
            type="text"
            aria-label="Search SKU, Invoice, Seller..."
            placeholder="Search SKU, Invoice, Seller..."
            leading={<Icon name="icon-9c4a10ac" size={16} />}
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>

        <div className={styles.filter}>
          <Select aria-label="Status" value={statusFilter} onChange={onStatusFilterChange}>
            <option value="All">All Status</option>
            <option value="Delivered">Delivered</option>
            <option value="In-Transit">In-Transit</option>
          </Select>
        </div>

        <SegmentedControl
          aria-label="View mode"
          options={VIEW_OPTIONS}
          value={viewMode}
          onValueChange={onViewModeChange}
        />

        {showExpandToggle && (
          <Button
            variant="secondary"
            leftIcon={<Icon name="icon-89725ea1" size={14} />}
            onClick={onToggleExpandAll}
            aria-expanded={allExpanded}
            title={allExpanded ? "Collapse All Groups" : "Expand All Groups"}
          >
            {allExpanded ? "Collapse All" : "Expand All"}
          </Button>
        )}

        <Button
          variant="secondary"
          leftIcon={<Icon name="archive-this-record" size={15} />}
          onClick={onToggleShowArchived}
          aria-pressed={showArchived}
          title={showArchived ? "Hide archived records" : "Show archived records"}
        >
          {showArchived ? "Hide Archived" : "Show Archived"}
        </Button>
      </div>
    </div>
  );
}
