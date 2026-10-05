import Image from "next/image";
import Card from "@/components/ui/Card/Card";
import IconButton from "@/components/ui/IconButton/IconButton";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./RecentlyAdded.module.css";

const formatDate = (value) => value ? new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
}) : '';

export default function RecentlyAdded({
    items,
    user,
    loading,
    refreshing,
    deleteButtonLoading,
    deletingItemId,
    onRefresh,
    onDelete,
    onCopy,
}) {
    return (
        <section className={styles.root}>
            <div className={styles.header}>
                <h2 className={styles.title}>Recently Added (Last {items.length})</h2>
                <IconButton
                    name="refresh"
                    aria-label="Refresh Recent Inventory"
                    title="Refresh Recent Inventory"
                    onClick={onRefresh}
                    disabled={loading || refreshing}
                    loading={refreshing}
                />
            </div>
            {loading ? (
                <div className={styles.grid} aria-busy="true" aria-label="Loading...">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Card key={index} padding="sm" className={styles.card}>
                            <Skeleton className={styles.media} />
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="80%" />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className={styles.grid}>
                    {items.map((item) => {
                        const itemKey = item._id || item.inventoryId;
                        const canArchive = user?.role === 'admin' || user?.role === 'superadmin' || item.addedBy === user?.id;
                        return (
                            <Card key={itemKey} padding="sm" className={styles.card}>
                                {canArchive && (
                                    <span className={styles.action}>
                                        <IconButton
                                            name="trash"
                                            size="sm"
                                            variant="secondary"
                                            aria-label="Remove from recent"
                                            title="Remove from recent"
                                            onClick={() => onDelete(itemKey)}
                                            disabled={deleteButtonLoading}
                                            loading={deleteButtonLoading && deletingItemId === itemKey}
                                        />
                                    </span>
                                )}
                                <div className={styles.media}>
                                    {item.imageUrl ? (
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.inventoryId}
                                            fill
                                            className={styles.image}
                                            unoptimized
                                        />
                                    ) : (
                                        <span className={styles.placeholder}>No Image</span>
                                    )}
                                </div>
                                <div className={styles.idRow}>
                                    <p className={styles.id}>{item.inventoryId}</p>
                                    <IconButton
                                        name="copy-inventory-id"
                                        size="sm"
                                        aria-label="Copy Inventory ID"
                                        title="Copy Inventory ID"
                                        onClick={() => onCopy(item.inventoryId)}
                                    />
                                </div>
                                <p className={styles.date}>{formatDate(item?.createdAt)}</p>
                            </Card>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
