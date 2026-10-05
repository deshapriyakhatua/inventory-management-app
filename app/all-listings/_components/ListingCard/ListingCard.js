import Image from "next/image";
import Icon from "@/components/ui/Icon/Icon";
import MarketplaceLogo from "../../../../components/MarketplaceLogo/MarketplaceLogo";
import StatusDot from "../StatusDot/StatusDot";
import { STATUS_COLORS } from "../../allListingsConfig";
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

    return (
        <div
            className={styles.gridCard}
            onClick={() => onSelect(item)}
            style={{ cursor: 'pointer' }}
        >
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                }}
                className={styles.deleteBtn}
                title="Delete Listing"
                disabled={deleteButtonLoading && deletingListingId === item.skuId}
            >
                {deleteButtonLoading && deletingListingId === item.skuId
                    ? <Icon name="refresh-loop" size={16} className={styles.deleteLoadingIcon} />
                    : <Icon name="trash" size={16} className={styles.deleteIcon} />
                }
            </button>
            {/* Edit button – sits top-right on the card */}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className={styles.editCardBtn}
                title="Edit Listing"
            >
                <Icon name="edit-inventory" size={14} />
            </button>
            <div className={styles.imageContainer} data-count={displayImages.length}>
                {displayImages.length > 0 ? (
                    displayImages.map((inv, idx) => (
                        <div key={idx} className={styles.multiImageCell}>
                            <Image
                                src={inv.imageUrl}
                                alt={item.skuId}
                                referrerPolicy="no-referrer"
                                fill
                                className={styles.itemImage}
                                unoptimized
                            />
                            {idx === 3 && validImages.length > 4 && (
                                <div className={styles.moreImagesOverlay}>
                                    +{validImages.length - 4}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className={styles.imagePlaceholder}>
                        <Icon name="icon-b99b6c9f" size={32} style={{opacity:0.5,marginBottom:'0.5rem'}} />
                        <br />No Images
                    </div>
                )}
            </div>
            <div className={styles.cardInfo}>
                <div className={styles.skuHeaderRow}>
                    <p className={styles.itemId}>{item.skuId}</p>
                    <button
                        className={styles.smallCopyBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            onCopy(item.skuId, "SKU ID");
                        }}
                        title="Copy SKU ID"
                    >
                        <Icon name="copy-inventory-id" size={14} />
                    </button>
                </div>
                <div className={styles.metaInfoRow}>
                    <StatusDot status={item.status} />
                    <p
                        className={styles.itemStatus}
                        style={{ color: STATUS_COLORS[item.status?.toLowerCase()]?.label || '#94a3b8' }}
                    >
                        {item.status?.toUpperCase() || "ACTIVE"}
                    </p>
                    <span className={styles.dotSeparator}>•</span>
                    <div className={styles.marketplaceBadge}>
                        <MarketplaceLogo marketplace={item.marketplace} size={16} />
                        <p className={styles.itemMarketplace}>{item.marketplace || 'Direct'}</p>
                    </div>
                </div>
                <p className={styles.itemDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                    })}
                </p>
            </div>
        </div>
    );
}
