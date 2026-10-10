import InventoryPickerGrid from "../InventoryPickerGrid/InventoryPickerGrid";
import InventorySearchBar from "../InventorySearchBar/InventorySearchBar";
import PickerModalHeader from "../PickerModalHeader/PickerModalHeader";
import styles from "./InventoryPickerModal.module.css";

// Inventory Selection Modal (single line item)
export default function InventoryPickerModal({
  searchRef,
  inventorySearch,
  filteredInventory,
  selectedInventoryId,
  onSearchChange,
  onClearSearch,
  onSelectItem,
  onClose,
}) {
  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <PickerModalHeader
          title="Select Inventory Item"
          subtitle="Choose an inventory item to insert into the invoice line item."
          onClose={onClose}
        />

        {/* Search */}
        <InventorySearchBar
          inputRef={searchRef}
          value={inventorySearch}
          onChange={onSearchChange}
          onClear={onClearSearch}
        />

        {/* Grid */}
        <InventoryPickerGrid
          items={filteredInventory}
          isItemSelected={(inv) => selectedInventoryId === inv.inventoryId}
          onItemClick={onSelectItem}
        />
      </div>
    </div>
  );
}
