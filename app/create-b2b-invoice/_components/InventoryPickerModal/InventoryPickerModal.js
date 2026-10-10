import Modal from "@/components/ui/Modal/Modal";
import InventoryPickerGrid from "../InventoryPickerGrid/InventoryPickerGrid";
import InventorySearchBar from "../InventorySearchBar/InventorySearchBar";
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
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Select Inventory Item"
      description="Choose an inventory item to insert into the invoice line item."
    >
      <div className={styles.root}>
        <InventorySearchBar
          inputRef={searchRef}
          value={inventorySearch}
          onChange={onSearchChange}
          onClear={onClearSearch}
        />

        <InventoryPickerGrid
          items={filteredInventory}
          isItemSelected={(inv) => selectedInventoryId === inv.inventoryId}
          onItemClick={onSelectItem}
        />
      </div>
    </Modal>
  );
}
