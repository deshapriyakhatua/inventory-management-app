import Image from "next/image";
import IconButton from "@/components/ui/IconButton/IconButton";
import ChoiceGroup from "../ChoiceGroup/ChoiceGroup";
import styles from "./SelectedItems.module.css";

export default function SelectedItems({ items, isCombo, onRemove }) {
    return (
        <ChoiceGroup label={`Selected Items (${items.length}) ${isCombo ? "- Combo Mode" : ""}`}>
            <div className={styles.root}>
                {items.map((item) => (
                    <div key={item.inventoryId} className={styles.thumb}>
                        <div className={styles.media}>
                            <IconButton
                                name="remove-this-product"
                                size="sm"
                                variant="danger"
                                aria-label="Remove item"
                                title="Remove item"
                                className={styles.remove}
                                onClick={() => onRemove(item)}
                            />
                            {item.imageUrl ? (
                                <Image src={item.imageUrl} alt={item.inventoryId} fill className={styles.image} unoptimized />
                            ) : (
                                <div className={styles.placeholder}>No Img</div>
                            )}
                        </div>
                        <div className={styles.id}>{item.inventoryId}</div>
                    </div>
                ))}
            </div>
        </ChoiceGroup>
    );
}
