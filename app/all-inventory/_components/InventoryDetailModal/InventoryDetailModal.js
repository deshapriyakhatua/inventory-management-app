import Icon from "@/components/ui/Icon/Icon";
import SmoothImage from "@/components/SmoothImage/SmoothImage";
import SkuCard from "../SkuCard/SkuCard";
import styles from "./InventoryDetailModal.module.css";

export default function InventoryDetailModal({
    selectedItem,
    modalSkus,
    modalSkusLoading,
    onClose,
    onCopy,
}) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeModal} onClick={onClose}>
                    <Icon name="remove-this-product" size={24} />
                </button>

                <div className={styles.modalScrollArea}>
                    <div className={styles.modalHeader}>
                        <div className={styles.modalImageContainer}>
                            {selectedItem.imageUrl ? (
                                <SmoothImage
                                    src={selectedItem.imageUrl}
                                    alt={selectedItem.inventoryId}
                                    fill
                                    className={styles.modalImage}
                                    unoptimized
                                />
                            ) : (
                                <div className={styles.modalImagePlaceholder}>No Image</div>
                            )}
                        </div>
                        <div className={styles.modalMainInfo}>
                            <div className={styles.idWithCopy}>
                                <h2 className={styles.modalId}>{selectedItem.inventoryId}</h2>
                                <button
                                    className={styles.copyButton}
                                    onClick={() => onCopy(selectedItem.inventoryId, "Inventory ID")}
                                    title="Copy ID"
                                >
                                    <Icon name="copy-inventory-id" size={16} />
                                </button>
                            </div>
                            <p className={styles.modalVertical}>{selectedItem.vertical}</p>
                            <p className={styles.modalDate}>
                                {selectedItem?.createdAt ? `Added on ${new Date(selectedItem.createdAt).toLocaleString('en-IN', {
                                    month: 'long', day: 'numeric', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className={styles.metricsGrid}>
                        <div className={`${styles.metricCard} ${styles.highlightMetric}`}>
                            <span className={styles.metricLabel}>Unit Price</span>
                            <span className={styles.metricValue}>₹ {Math.ceil(selectedItem.buyPriceUnit ?? 0)}</span>
                        </div>
                        <div className={`${styles.metricCard} ${styles.highlightMetric}`}>
                            <span className={styles.metricLabel}>Current Stock</span>
                            <span className={styles.metricValue}>{selectedItem.currentStock ?? 0}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Initial Stock</span>
                            <span className={styles.metricValue}>{selectedItem.initialStock ?? 0}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Gross Ordered</span>
                            <span className={styles.metricValue}>{selectedItem.grossOrdered ?? 0}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Net Sold</span>
                            <span className={styles.metricValue}>{selectedItem.netSold ?? 0}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Cancelled</span>
                            <span className={styles.metricValue}>{selectedItem.cancelled ?? 0}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Returned</span>
                            <span className={styles.metricValue}>{selectedItem.returned ?? 0}</span>
                        </div>
                    </div>

                    {/* SKUs Section */}
                    {modalSkusLoading ? (
                        <div className={styles.modalSection}>
                            <h3 className={styles.sectionTitle}>Associated SKUs</h3>
                            <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>Loading SKUs...</p>
                        </div>
                    ) : (
                        modalSkus && modalSkus.length > 0 && (
                            <div className={styles.modalSection}>
                                <h3 className={styles.sectionTitle}>Associated SKUs</h3>
                                <div className={styles.skuGrid}>
                                    {modalSkus.map((sku, index) => (
                                        <SkuCard key={index} sku={sku} onCopy={onCopy} />
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
