import Image from "next/image";
import styles from "./ItemThumbnail.module.css";

export default function ItemThumbnail({ item, onMouseEnter, onMouseLeave }) {
  return item.imageUrl ? (
    <div
      className={styles.root}
      onMouseEnter={(e) => onMouseEnter(e, item)}
      onMouseLeave={onMouseLeave}
    >
      <Image src={item.imageUrl} alt={item.inventoryId || "Item"} width={38} height={38} className={styles.image} />
    </div>
  ) : (
    <div className={styles.placeholder}>NA</div>
  );
}
