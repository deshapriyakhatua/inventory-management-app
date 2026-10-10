import Image from "next/image";
import Icon from "@/components/ui/Icon/Icon";
import cx from "@/components/ui/cx";
import styles from "./InventoryPickerCard.module.css";

export default function InventoryPickerCard({ inv, isSelected, onClick }) {
  return (
    <button
      type="button"
      className={cx(styles.root, isSelected && styles.isSelected)}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      <span className={styles.media}>
        {inv.imageUrl ? (
          <Image
            src={inv.imageUrl}
            alt={inv.inventoryId}
            fill
            sizes="10rem"
            className={styles.image}
            unoptimized
          />
        ) : (
          <span className={styles.noImage}>No Image</span>
        )}
        {isSelected && (
          <span className={styles.tick}>
            <Icon name="icon-5ab11cbf" size={12} />
          </span>
        )}
      </span>
      <span className={styles.cardId}>{inv.inventoryId}</span>
      {inv.currentStock !== undefined && (
        <span className={cx(styles.stock, inv.currentStock <= 5 && styles.stockLow)}>
          Stock: {inv.currentStock ?? 0}
        </span>
      )}
    </button>
  );
}
