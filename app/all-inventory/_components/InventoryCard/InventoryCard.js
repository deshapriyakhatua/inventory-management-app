import Image from "next/image";
import Badge from "@/components/ui/Badge/Badge";
import Card from "@/components/ui/Card/Card";
import IconButton from "@/components/ui/IconButton/IconButton";
import cx from "@/components/ui/cx";
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
        <Card as="article" padding="sm" className={styles.root}>
            <button
                type="button"
                className={styles.open}
                aria-label={item.inventoryId}
                onClick={() => onSelect(item)}
            />

            {item.isArchived ? (
                <IconButton
                    name="restore-inventory"
                    size="sm"
                    onClick={() => onRestore(item._id)}
                    className={cx(styles.action, styles.actionStart)}
                    title="Restore Inventory"
                    aria-label="Restore Inventory"
                    disabled={restoreButtonLoading}
                />
            ) : canArchive ? (
                <IconButton
                    name="trash"
                    size="sm"
                    onClick={() => onDelete(item._id)}
                    className={cx(styles.action, styles.actionStart, styles.isDanger)}
                    title="Archive Inventory"
                    aria-label="Archive Inventory"
                    disabled={deleteButtonLoading}
                    loading={deleteButtonLoading && deletingItemId === item._id}
                />
            ) : null}

            {item.isArchived ? (
                <IconButton
                    name="permanently-delete"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPermanentDelete(item._id);
                    }}
                    className={cx(styles.action, styles.actionEnd, styles.isDanger)}
                    title="Permanently Delete"
                    aria-label="Permanently Delete"
                />
            ) : (
                <IconButton
                    name="edit-inventory"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                    }}
                    className={cx(styles.action, styles.actionEnd)}
                    title="Edit Inventory"
                    aria-label="Edit Inventory"
                />
            )}

            <div className={styles.media}>
                {item.imageUrl ? (
                    <Image
                        src={item.imageUrl}
                        alt={item.inventoryId}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className={styles.image}
                    />
                ) : (
                    <span className={styles.placeholder}>No Image</span>
                )}
            </div>

            <div className={styles.info}>
                <div className={styles.idRow}>
                    <p className={styles.id} title={item.inventoryId}>{item.inventoryId}</p>
                    <IconButton
                        name="copy-inventory-id"
                        size="sm"
                        className={styles.copy}
                        onClick={(e) => {
                            e.stopPropagation();
                            onCopy(item.inventoryId, "SKU");
                        }}
                        title="Copy SKU"
                        aria-label="Copy SKU"
                    />
                </div>
                <p className={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                    })}
                </p>
                <div className={styles.footer}>
                    <Badge tone={item.currentStock <= 10 ? "danger" : "success"} className={styles.stock}>
                        Stock: <span className={styles.stockValue}>{item.currentStock ?? 0}</span>
                    </Badge>
                    <p className={styles.price}>
                        ₹{item.fifoUnitCost ?? 0}
                    </p>
                </div>
            </div>
        </Card>
    );
}
