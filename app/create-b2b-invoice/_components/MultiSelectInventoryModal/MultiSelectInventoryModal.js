import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Modal from "@/components/ui/Modal/Modal";
import InventoryPickerGrid from "../InventoryPickerGrid/InventoryPickerGrid";
import InventorySearchBar from "../InventorySearchBar/InventorySearchBar";
import styles from "./MultiSelectInventoryModal.module.css";

// Multi-Select Inventory Modal
export default function MultiSelectInventoryModal({
  open,
  searchRef,
  multiSelectSearch,
  filteredMultiInventory,
  selectedInvIds,
  onSearchChange,
  onClearSearch,
  onSelectAllFiltered,
  onClearSelection,
  onToggleItem,
  onAddBlankRow,
  onAddSelectedItems,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Select Inventory Items"
      description="Choose one or multiple items to batch-add to the invoice."
    >
      <div className={styles.root}>
        <InventorySearchBar
          inputRef={searchRef}
          value={multiSelectSearch}
          onChange={onSearchChange}
          onClear={onClearSearch}
        />

        {/* Sub-bar with count & quick select actions */}
        <div className={styles.selectionBar}>
          <Badge tone="success" className={styles.count}>
            {selectedInvIds.length} item{selectedInvIds.length !== 1 ? "s" : ""} selected
          </Badge>
          <div className={styles.quickActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectAllFiltered(filteredMultiInventory)}
            >
              Select All Filtered
            </Button>
            {selectedInvIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className={styles.clearButton}
                onClick={onClearSelection}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>

        <InventoryPickerGrid
          items={filteredMultiInventory}
          isItemSelected={(inv) => selectedInvIds.includes(inv.inventoryId)}
          onItemClick={(inv) => onToggleItem(inv.inventoryId)}
        />

        {/* Modal Footer Actions */}
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onAddBlankRow}>
            + Add Blank Custom Row
          </Button>
          <Button onClick={onAddSelectedItems}>
            {selectedInvIds.length > 0
              ? `Apply Selection (${selectedInvIds.length} Item${selectedInvIds.length !== 1 ? "s" : ""})`
              : "Apply (0 Items Selected)"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
