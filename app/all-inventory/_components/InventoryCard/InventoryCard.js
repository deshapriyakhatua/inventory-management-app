import Icon from "@/components/ui/Icon/Icon";
import SmoothImage from "@/components/SmoothImage/SmoothImage";
import styles from "./InventoryCard.module.css";

export default function InventoryCard({
    item,
    user,
    restoreButtonLoading,
    deleteButtonLoading,
    deletingItemId,
    onRestore,
    onDelete,
    onPermanentDelete,
    onEdit,
    onCopy,
    onSelect,
}) {
    const canArchive = user?.role === 'admin' || user?.role === 'superadmin' || item.addedBy === user?.id;
    return (
        <div
            className={styles.gridCard}
        >
            {item.isArchived ? (
                <button
                    type="button"
                    onClick={() => onRestore(item._id)}
                    className={styles.deleteBtn}
                    title="Restore Inventory"
                    disabled={restoreButtonLoading}
                >
                    <Icon name="restore-inventory" size={16} />
                </button>
            ) : canArchive ? (
                <button
                    type="button"
                    onClick={() => onDelete(item._id)}
                    className={styles.deleteBtn}
                    title="Archive Inventory"
                    disabled={deleteButtonLoading}
                >
                    {deleteButtonLoading && deletingItemId === item._id
                        ? <Icon name="refresh-loop" size={16} className={styles.deleteLoadingIcon} />
                        : <Icon name="trash" size={16} className={styles.deleteIcon} />
                    }
                </button>
            ) : null}

            {item.isArchived ? (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPermanentDelete(item._id);
                    }}
                    className={styles.editCardBtn}
                    title="Permanently Delete"
                >
                    <Icon name="permanently-delete" size={14} />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                    }}
                    className={styles.editCardBtn}
                    title="Edit Inventory"
                >
                    <Icon name="edit-inventory" size={14} />
                </button>
            )}

            <div className={styles.imageContainer}>
                {item.imageUrl ? (
                    <SmoothImage
                        src={item.imageUrl}
                        alt={item.inventoryId}
                        fill
                        className={styles.itemImage}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.imagePlaceholder}>No Image</div>
                )}
            </div>
            <div className={styles.cardInfo}>
                <div className={styles.skuHeaderRow}>
                    <p className={styles.itemId} title={item.inventoryId}>{item.inventoryId}</p>
                    <button
                        className={styles.smallCopyBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            onCopy(item.inventoryId, "SKU");
                        }}
                        title="Copy SKU"
                    >
                        <Icon name="copy-inventory-id" size={14} />
                    </button>
                </div>
                <p className={styles.itemDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                    })}
                </p>
                <div className={styles.stockAndPriceContainer}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <div className={styles.stockBadge}>
                            <span className={styles.stockLabel}>Stock:</span>
                            <span className={`${styles.stockValue} ${item.currentStock <= 10 ? styles.lowStock : ''}`}>
                                {item.currentStock ?? 0}
                            </span>
                        </div>
                    </div>
                    <p className={styles.itemPrice}>
                        ₹{item.fifoUnitCost ?? 0}
                    </p>
                </div>
            </div>

            <div
                className={styles.clickableOverlay}
                onClick={() => onSelect(item)}
            />
        </div>
    );
}
