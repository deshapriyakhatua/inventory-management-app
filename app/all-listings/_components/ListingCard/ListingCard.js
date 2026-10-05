import Image from "next/image";
import Card from "@/components/ui/Card/Card";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import cx from "@/components/ui/cx";
import MarketplaceLogo from "@/components/MarketplaceLogo/MarketplaceLogo";
import StatusDot from "../StatusDot/StatusDot";
import styles from "./ListingCard.module.css";

export default function ListingCard({
    item,
    deleteButtonLoading,
    deletingListingId,
    onSelect,
    onDelete,
    onEdit,
    onCopy,
}) {
    const validImages = item.inventoryItems?.filter(inv => inv.imageUrl) || [];
    const displayImages = validImages.slice(0, 4);
    const isDeleting = deleteButtonLoading && deletingListingId === item.skuId;

    return (
        <Card as="article" padding="sm" className={styles.root}>
            <button
                type="button"
                className={styles.open}
                aria-label={item.skuId}
                onClick={() => onSelect(item)}
            />

            <IconButton
                name="trash"
                size="sm"
                onClick={() => onDelete(item)}
                className={cx(styles.action, styles.actionStart, styles.isDanger)}
                title="Delete Listing"
                aria-label="Delete Listing"
                disabled={isDeleting}
                loading={isDeleting}
            />
            <IconButton
                name="edit-inventory"
                size="sm"
                onClick={() => onEdit(item)}
                className={cx(styles.action, styles.actionEnd)}
                title="Edit Listing"
                aria-label="Edit Listing"
            />

            <div className={styles.media} data-count={displayImages.length}>
                {displayImages.length > 0 ? (
                    displayImages.map((inv, idx) => (
                        <div key={idx} className={styles.cell}>
                            <Image
                                src={inv.imageUrl}
                                alt={item.skuId}
                                referrerPolicy="no-referrer"
                                fill
                                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className={styles.image}
                                unoptimized
                            />
                            {idx === 3 && validImages.length > 4 && (
                                <div className={styles.more}>
                                    +{validImages.length - 4}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className={styles.placeholder}>
                        <Icon name="icon-b99b6c9f" size={32} className={styles.placeholderIcon} />
                        No Images
                    </div>
                )}
            </div>

            <div className={styles.info}>
                <div className={styles.idRow}>
                    <p className={styles.id} title={item.skuId}>{item.skuId}</p>
                    <IconButton
                        name="copy-inventory-id"
                        size="sm"
                        className={styles.copy}
                        onClick={() => onCopy(item.skuId, "SKU ID")}
                        title="Copy SKU ID"
                        aria-label="Copy SKU ID"
                    />
                </div>
                <div className={styles.meta}>
                    <StatusDot status={item.status} className={styles.status}>
                        {item.status?.toUpperCase() || "ACTIVE"}
                    </StatusDot>
                    <span aria-hidden="true" className={styles.separator}>•</span>
                    <span className={styles.marketplace}>
                        <MarketplaceLogo marketplace={item.marketplace} size={16} />
                        {item.marketplace || 'Direct'}
                    </span>
                </div>
                <p className={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                    })}
                </p>
            </div>
        </Card>
    );
}
