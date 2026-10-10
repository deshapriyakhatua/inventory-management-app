import EmptyState from "@/components/ui/EmptyState/EmptyState";
import Icon from "@/components/ui/Icon/Icon";
import InventoryPickerCard from "../InventoryPickerCard/InventoryPickerCard";
import styles from "./InventoryPickerGrid.module.css";

// Shared grid of the single and multi-select inventory modals.
export default function InventoryPickerGrid({ items, isItemSelected, onItemClick }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="icon-9c4a10ac" size={40} />}
        title="No inventory items found."
      />
    );
  }

  return (
    <div className={styles.root}>
      {items.map((inv) => {
        const isSelected = isItemSelected(inv);
        return (
          <InventoryPickerCard
            key={inv._id || inv.inventoryId}
            inv={inv}
            isSelected={isSelected}
            onClick={() => onItemClick(inv)}
          />
        );
      })}
    </div>
  );
}
