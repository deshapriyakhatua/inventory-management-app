import styles from "./ItemThumbnail.module.css";

export default function ItemThumbnail({ item, onMouseEnter, onMouseLeave }) {
  return item.imageUrl ? (
    <div
      className={styles.imageWrapper}
      onMouseEnter={(e) => onMouseEnter(e, item)}
      onMouseLeave={onMouseLeave}
    >
      <img src={item.imageUrl} alt={item.inventoryId || "Item"} className={styles.itemImageThumbnail} />
    </div>
  ) : (
    <div className={styles.imagePlaceholder}>NA</div>
  );
}
