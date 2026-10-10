import InventoryPickerGrid from "../InventoryPickerGrid/InventoryPickerGrid";
import InventorySearchBar from "../InventorySearchBar/InventorySearchBar";
import PickerModalHeader from "../PickerModalHeader/PickerModalHeader";
import styles from "./MultiSelectInventoryModal.module.css";

// Multi-Select Inventory Modal
export default function MultiSelectInventoryModal({
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
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <PickerModalHeader
          title="Select Inventory Items"
          subtitle="Choose one or multiple items to batch-add to the invoice."
          onClose={onClose}
        />

        {/* Search Input */}
        <InventorySearchBar
          inputRef={searchRef}
          value={multiSelectSearch}
          onChange={onSearchChange}
          onClear={onClearSearch}
        />

        {/* Sub-bar with count & quick select actions */}
        <div className={styles.multiSelectBar}>
          <span className={styles.selectedCountTag}>
            {selectedInvIds.length} item{selectedInvIds.length !== 1 ? "s" : ""} selected
          </span>
          <div className={styles.quickSelectActions}>
            <button
              type="button"
              className={styles.quickSelectBtn}
              onClick={() => onSelectAllFiltered(filteredMultiInventory)}
            >
              Select All Filtered
            </button>
            {selectedInvIds.length > 0 && (
              <button
                type="button"
                className={styles.quickSelectBtn}
                style={{ color: "#f87171" }}
                onClick={onClearSelection}
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* Grid of Items */}
        <InventoryPickerGrid
          items={filteredMultiInventory}
          isItemSelected={(inv) => selectedInvIds.includes(inv.inventoryId)}
          onItemClick={(inv) => onToggleItem(inv.inventoryId)}
        />

        {/* Modal Footer Actions */}
        <div className={styles.multiSelectFooter}>
          <button
            type="button"
            className={styles.addBlankBtn}
            onClick={onAddBlankRow}
          >
            + Add Blank Custom Row
          </button>

          <button
            type="button"
            className={styles.addSelectedBtn}
            onClick={onAddSelectedItems}
          >
            {selectedInvIds.length > 0
              ? `Apply Selection (${selectedInvIds.length} Item${selectedInvIds.length !== 1 ? "s" : ""})`
              : "Apply (0 Items Selected)"}
          </button>
        </div>
      </div>
    </div>
  );
}
