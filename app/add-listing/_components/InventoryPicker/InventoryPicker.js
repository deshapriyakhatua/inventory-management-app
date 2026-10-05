import Image from "next/image";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import cx from "@/components/ui/cx";
import ChoiceGroup from "../ChoiceGroup/ChoiceGroup";
import styles from "./InventoryPicker.module.css";

export default function InventoryPicker({
    items,
    selectedItems,
    loading,
    refreshing,
    onToggle,
    onRefresh,
    error,
}) {
    return (
        <ChoiceGroup
            label="Select Inventory Items to Add"
            error={error}
            action={
                <IconButton
                    name="refresh"
                    size="sm"
                    aria-label="Refresh Inventory"
                    title="Refresh Inventory"
                    onClick={onRefresh}
                    disabled={loading || refreshing}
                    loading={refreshing}
                />
            }
        >
            <div className={styles.root}>
                {loading ? (
                    <div className={styles.grid} aria-busy="true" aria-label="Loading inventory...">
                        {Array.from({ length: 8 }, (_, i) => (
                            <Skeleton key={i} className={styles.skeleton} />
                        ))}
                    </div>
                ) : items.length > 0 ? (
                    <div className={styles.grid}>
                        {items.map((item) => {
                            const isSelected = selectedItems.some(s => s.inventoryId === item.inventoryId);
                            return (
                                <button
                                    key={item._id}
                                    type="button"
                                    aria-pressed={isSelected}
                                    className={cx(styles.item, isSelected && styles.itemSelected)}
                                    onClick={() => onToggle(item)}
                                >
                                    {isSelected && (
                                        <span className={styles.checkmark}>
                                            <Icon name="icon-5ab11cbf" size={12} />
                                        </span>
                                    )}
                                    <span className={styles.media}>
                                        {item.imageUrl ? (
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.inventoryId}
                                                fill
                                                className={styles.image}
                                                unoptimized
                                            />
                                        ) : (
                                            <Icon name="icon-b99b6c9f" size={24} className={styles.placeholderIcon} />
                                        )}
                                    </span>
                                    <span className={styles.id}>{item.inventoryId}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState title="No inventory found for this vertical." />
                )}
            </div>
        </ChoiceGroup>
    );
}
