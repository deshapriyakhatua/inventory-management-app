import Image from "next/image";
import Icon from "@/components/ui/Icon/Icon";
import MarketplaceLogo from "../../../../components/MarketplaceLogo/MarketplaceLogo";
import StatusDot from "../StatusDot/StatusDot";
import { STATUS_COLORS } from "../../allListingsConfig";
import styles from "./ListingDetailModal.module.css";

export default function ListingDetailModal({ selectedListing, onClose, onCopy }) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Listing Details</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <Icon name="remove-this-product" size={24} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.modalSection}>
                        <div className={styles.skuHeaderRow}>
                            <h3>{selectedListing.skuId}</h3>
                            <button
                                className={styles.iconCopyBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCopy(selectedListing.skuId, "SKU ID");
                                }}
                                title="Copy SKU ID"
                            >
                                <Icon name="copy-inventory-id" size={18} />
                            </button>
                        </div>
                        <div className={styles.metaGrid}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Status</span>
                                <div className={styles.metaValueBadge}>
                                    <StatusDot status={selectedListing.status} size={10} />
                                    <span
                                        className={styles.metaValue}
                                        style={{ color: STATUS_COLORS[selectedListing.status?.toLowerCase()]?.label || '#94a3b8' }}
                                    >
                                        {selectedListing.status?.charAt(0).toUpperCase() + selectedListing.status?.slice(1) || 'Active'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Vertical</span>
                                <span className={styles.metaValue}>{selectedListing.vertical}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Marketplace</span>
                                <div className={styles.metaValueBadge}>
                                    <MarketplaceLogo marketplace={selectedListing.marketplace} size={22} />
                                    <span className={styles.metaValue}>{selectedListing.marketplace || 'Direct'}</span>
                                </div>
                            </div>
                            {selectedListing.styleId && (
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Style ID</span>
                                    <span className={styles.metaValue}>{selectedListing.styleId}</span>
                                </div>
                            )}
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Date Created</span>
                                <span className={styles.metaValue}>
                                    {selectedListing?.createdAt ? new Date(selectedListing.createdAt).toLocaleString('en-US', {
                                        month: 'long', day: 'numeric', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    }) : '—'}
                                </span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Total Items</span>
                                <span className={styles.metaValue}>{selectedListing.inventoryItems?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalSection}>
                        <h4 className={styles.inventoryTitle}>Associated Inventory</h4>
                        {selectedListing.inventoryItems && selectedListing.inventoryItems.length > 0 ? (
                            <div className={styles.modalInventoryGrid}>
                                {selectedListing.inventoryItems.map((inv, idx) => (
                                    <div key={idx} className={styles.modalInventoryCard}>
                                        <div className={styles.modalImageWrapper}>
                                            {inv.imageUrl ? (
                                                <Image
                                                    src={inv.imageUrl}
                                                    alt={inv.inventoryId}
                                                    referrerPolicy="no-referrer"
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className={styles.modalImagePlaceholder}>No Image</div>
                                            )}
                                        </div>
                                        <div className={styles.modalCardFooter}>
                                            <span className={styles.modalInventoryId}>{inv.inventoryId}</span>
                                            <button
                                                className={styles.smallCopyBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCopy(inv.inventoryId, "Inventory ID");
                                                }}
                                                title="Copy ID"
                                            >
                                                <Icon name="copy-inventory-id" size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.modalEmpty}>No inventory associated with this SKU.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
