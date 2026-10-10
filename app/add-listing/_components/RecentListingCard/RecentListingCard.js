import Image from "next/image";
import Card from "@/components/ui/Card/Card";
import IconButton from "@/components/ui/IconButton/IconButton";
import MarketplaceLogo from "@/components/MarketplaceLogo/MarketplaceLogo";
import styles from "./RecentListingCard.module.css";

export default function RecentListingCard({ item, deleting, deleteDisabled, onDelete, onCopy }) {
    return (
        <Card as="article" padding="sm" className={styles.root}>
            {item.inventoryItems && item.inventoryItems.length > 0 ? (
                <div className={styles.strip}>
                    {item.inventoryItems.map((inv) => (
                        <div key={inv.inventoryId} className={styles.thumb}>
                            <div className={styles.thumbMedia}>
                                {inv.imageUrl ? (
                                    <Image
                                        src={inv.imageUrl}
                                        alt={inv.inventoryId}
                                        referrerPolicy="no-referrer"
                                        fill
                                        className={styles.thumbImage}
                                        unoptimized
                                    />
                                ) : (
                                    <span className={styles.thumbPlaceholder}>No Image</span>
                                )}
                            </div>
                            <div className={styles.thumbId}>{inv.inventoryId}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.empty}>No Images Linked</div>
            )}

            <div className={styles.info}>
                <div className={styles.idRow}>
                    <MarketplaceLogo marketplace={item.marketplace} size={18} label={item.marketplace} />
                    <p className={styles.sku}>{item.skuId}</p>
                    <IconButton
                        name="copy-inventory-id"
                        size="sm"
                        aria-label="Copy SKU ID"
                        title="Copy SKU ID"
                        onClick={() => onCopy(item.skuId)}
                    />
                    <IconButton
                        name="trash"
                        size="sm"
                        aria-label="Remove from recent"
                        title="Remove from recent"
                        className={styles.delete}
                        onClick={() => onDelete(item.skuId)}
                        disabled={deleteDisabled}
                        loading={deleting}
                    />
                </div>
                <div className={styles.meta}>
                    <span>{item.vertical}</span>
                    <span aria-hidden="true" className={styles.dot}>•</span>
                    <span>{item.marketplace || 'Direct'}</span>
                </div>
                <p className={styles.date}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }) : 'Recently added'}
                </p>
            </div>
        </Card>
    );
}
