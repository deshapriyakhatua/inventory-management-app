import Image from "next/image";
import IconButton from "@/components/ui/IconButton/IconButton";
import Modal from "@/components/ui/Modal/Modal";
import cx from "@/components/ui/cx";
import SkuCard from "../SkuCard/SkuCard";
import styles from "./InventoryDetailModal.module.css";

export default function InventoryDetailModal({
    selectedItem,
    modalSkus,
    modalSkusLoading,
    onClose,
    onCopy,
}) {
    const metrics = [
        { label: "Unit Price", value: `₹ ${Math.ceil(selectedItem.buyPriceUnit ?? 0)}`, highlight: true },
        { label: "Current Stock", value: selectedItem.currentStock ?? 0, highlight: true },
        { label: "Initial Stock", value: selectedItem.initialStock ?? 0 },
        { label: "Gross Ordered", value: selectedItem.grossOrdered ?? 0 },
        { label: "Net Sold", value: selectedItem.netSold ?? 0 },
        { label: "Cancelled", value: selectedItem.cancelled ?? 0 },
        { label: "Returned", value: selectedItem.returned ?? 0 },
    ];

    return (
        <Modal open onClose={onClose} size="lg" ariaLabel={selectedItem.inventoryId}>
            <div className={styles.header}>
                <div className={styles.media}>
                    {selectedItem.imageUrl ? (
                        <Image
                            src={selectedItem.imageUrl}
                            alt={selectedItem.inventoryId}
                            fill
                            sizes="(min-width: 768px) 18.75rem, 100vw"
                            className={styles.image}
                        />
                    ) : (
                        <span className={styles.placeholder}>No Image</span>
                    )}
                </div>
                <div className={styles.mainInfo}>
                    <div className={styles.idRow}>
                        <h2 className={styles.id}>{selectedItem.inventoryId}</h2>
                        <IconButton
                            name="copy-inventory-id"
                            variant="secondary"
                            size="sm"
                            onClick={() => onCopy(selectedItem.inventoryId, "Inventory ID")}
                            title="Copy ID"
                            aria-label="Copy ID"
                        />
                    </div>
                    <p className={styles.vertical}>{selectedItem.vertical}</p>
                    <p className={styles.date}>
                        {selectedItem?.createdAt ? `Added on ${new Date(selectedItem.createdAt).toLocaleString('en-IN', {
                            month: 'long', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}` : ''}
                    </p>
                </div>
            </div>

            <div className={styles.metrics}>
                {metrics.map(metric => (
                    <div key={metric.label} className={cx(styles.metric, metric.highlight && styles.isHighlight)}>
                        <span className={styles.metricLabel}>{metric.label}</span>
                        <span className={styles.metricValue}>{metric.value}</span>
                    </div>
                ))}
            </div>

            {/* SKUs Section */}
            {modalSkusLoading ? (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Associated SKUs</h3>
                    <p className={styles.status} role="status">Loading SKUs...</p>
                </section>
            ) : (
                modalSkus && modalSkus.length > 0 && (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Associated SKUs</h3>
                        <div className={styles.skuList}>
                            {modalSkus.map((sku, index) => (
                                <SkuCard key={index} sku={sku} onCopy={onCopy} />
                            ))}
                        </div>
                    </section>
                ))}
        </Modal>
    );
}
