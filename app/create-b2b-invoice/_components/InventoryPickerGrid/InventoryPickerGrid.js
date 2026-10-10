import Icon from "@/components/ui/Icon/Icon";
import InventoryPickerCard from "../InventoryPickerCard/InventoryPickerCard";
import styles from "./InventoryPickerGrid.module.css";

// Shared grid of the single and multi-select inventory modals.
export default function InventoryPickerGrid({ items, isItemSelected, onItemClick }) {
  return (
    <div className={styles.pickerGrid}>
      {items.length === 0 ? (
        <div className={styles.pickerEmpty}>
          <Icon name="icon-9c4a10ac" size={40} style={{opacity:0.3}} />
          <span>No inventory items found.</span>
        </div>
      ) : (
        items.map((inv) => {
          const isSelected = isItemSelected(inv);
          return (
            <InventoryPickerCard
              key={inv._id || inv.inventoryId}
              inv={inv}
              isSelected={isSelected}
              onClick={() => onItemClick(inv)}
            />
          );
        })
      )}
    </div>
  );
}
