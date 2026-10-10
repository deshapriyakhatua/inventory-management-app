import Icon from "@/components/ui/Icon/Icon";
import styles from "./InventoryPickerCard.module.css";

export default function InventoryPickerCard({ inv, isSelected, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.pickerCard} ${
        isSelected ? styles.pickerCardSelected : ""
      }`}
      onClick={onClick}
    >
      <div className={styles.pickerCardImg}>
        {inv.imageUrl ? (
          <img src={inv.imageUrl} alt={inv.inventoryId} />
        ) : (
          <span className={styles.pickerCardNoImg}>No Image</span>
        )}
        {isSelected && (
          <span className={styles.pickerSelectedTick}>
            <Icon name="icon-5ab11cbf" size={12} />
          </span>
        )}
      </div>
      <span className={styles.pickerCardId}>{inv.inventoryId}</span>
      {inv.currentStock !== undefined && (
        <span
          className={`${styles.pickerCardStock} ${
            inv.currentStock <= 5 ? styles.pickerCardLowStock : ""
          }`}
        >
          Stock: {inv.currentStock ?? 0}
        </span>
      )}
    </button>
  );
}
