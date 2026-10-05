import Image from "next/image";
import IconButton from "@/components/ui/IconButton/IconButton";
import Modal from "@/components/ui/Modal/Modal";
import MarketplaceLogo from "@/components/MarketplaceLogo/MarketplaceLogo";
import StatusDot from "../StatusDot/StatusDot";
import styles from "./ListingDetailModal.module.css";

export default function ListingDetailModal({ selectedListing, onClose, onCopy }) {
    return (
        <Modal open onClose={onClose} size="lg" title="Listing Details">
            <div className={styles.root}>
                <section className={styles.section}>
                    <div className={styles.idRow}>
                        <h3 className={styles.id}>{selectedListing.skuId}</h3>
                        <IconButton
                            name="copy-inventory-id"
                            variant="secondary"
                            size="sm"
                            onClick={() => onCopy(selectedListing.skuId, "SKU ID")}
                            title="Copy SKU ID"
                            aria-label="Copy SKU ID"
                        />
                    </div>
                    <dl className={styles.metaGrid}>
                        <div className={styles.metaItem}>
                            <dt className={styles.metaLabel}>Status</dt>
                            <dd className={styles.metaChip}>
                                <StatusDot status={selectedListing.status} size="lg" className={styles.statusValue}>
                                    {selectedListing.status?.charAt(0).toUpperCase() + selectedListing.status?.slice(1) || 'Active'}
                                </StatusDot>
                            </dd>
                        </div>
                        <div className={styles.metaItem}>
                            <dt className={styles.metaLabel}>Vertical</dt>
                            <dd className={styles.metaValue}>{selectedListing.vertical}</dd>
                        </div>
                        <div className={styles.metaItem}>
                            <dt className={styles.metaLabel}>Marketplace</dt>
                            <dd className={styles.metaChip}>
                                <MarketplaceLogo marketplace={selectedListing.marketplace} size={22} />
                                <span className={styles.metaValue}>{selectedListing.marketplace || 'Direct'}</span>
                            </dd>
                        </div>
                        {selectedListing.styleId && (
                            <div className={styles.metaItem}>
                                <dt className={styles.metaLabel}>Style ID</dt>
                                <dd className={styles.metaValue}>{selectedListing.styleId}</dd>
                            </div>
                        )}
                        <div className={styles.metaItem}>
                            <dt className={styles.metaLabel}>Date Created</dt>
                            <dd className={styles.metaValue}>
                                {selectedListing?.createdAt ? new Date(selectedListing.createdAt).toLocaleString('en-US', {
                                    month: 'long', day: 'numeric', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                }) : '—'}
                            </dd>
                        </div>
                        <div className={styles.metaItem}>
                            <dt className={styles.metaLabel}>Total Items</dt>
                            <dd className={styles.metaValue}>{selectedListing.inventoryItems?.length || 0}</dd>
                        </div>
                    </dl>
                </section>

                <section className={styles.section}>
                    <h4 className={styles.sectionTitle}>Associated Inventory</h4>
                    {selectedListing.inventoryItems && selectedListing.inventoryItems.length > 0 ? (
                        <div className={styles.grid}>
                            {selectedListing.inventoryItems.map((inv, idx) => (
                                <div key={idx} className={styles.item}>
                                    <div className={styles.media}>
                                        {inv.imageUrl ? (
                                            <Image
                                                src={inv.imageUrl}
                                                alt={inv.inventoryId}
                                                referrerPolicy="no-referrer"
                                                fill
                                                sizes="10rem"
                                                className={styles.image}
                                                unoptimized
                                            />
                                        ) : (
                                            <span className={styles.placeholder}>No Image</span>
                                        )}
                                    </div>
                                    <div className={styles.itemFooter}>
                                        <span className={styles.itemId}>{inv.inventoryId}</span>
                                        <IconButton
                                            name="copy-inventory-id"
                                            size="sm"
                                            className={styles.copy}
                                            onClick={() => onCopy(inv.inventoryId, "Inventory ID")}
                                            title="Copy ID"
                                            aria-label="Copy ID"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.empty}>No inventory associated with this SKU.</p>
                    )}
                </section>
            </div>
        </Modal>
    );
}
