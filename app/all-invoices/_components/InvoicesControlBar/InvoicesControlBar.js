import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import SegmentedControl from "@/components/ui/SegmentedControl/SegmentedControl";
import Select from "@/components/ui/Select/Select";
import styles from "./InvoicesControlBar.module.css";

const VIEW_OPTIONS = [
  { value: "active", label: "Active Invoices" },
  {
    value: "archived",
    label: (
      <span className={styles.segment}>
        Archived Invoices
        <Icon name="trash" size={14} />
      </span>
    ),
  },
];

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
  const handleViewChange = (value) => (value === "archived" ? onShowArchived() : onShowActive());

  return (
    <div className={styles.root}>
      <SegmentedControl
        aria-label="Active or archived invoices"
        options={VIEW_OPTIONS}
        value={showArchived ? "archived" : "active"}
        onValueChange={handleViewChange}
      />

      <div className={styles.search}>
        <Input
          type="text"
          aria-label="Search Invoice #, Customer Name, SKU..."
          placeholder="Search Invoice #, Customer Name, SKU..."
          leading={<Icon name="icon-9c4a10ac" size={16} />}
          value={search}
          onChange={onSearchChange}
        />
      </div>

      <div className={styles.filters}>
        <div className={styles.filter}>
          <Select aria-label="Status" value={statusFilter} onChange={onStatusFilterChange}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>

        <IconButton
          name="refresh"
          variant="secondary"
          loading={loading}
          onClick={onRefresh}
          title="Refresh"
          aria-label="Refresh"
        />
      </div>
    </div>
  );
}
