import Image from "next/image";
import Icon from "@/components/ui/Icon/Icon";
import styles from "./SkuCard.module.css";

export default function SkuCard({ sku, onCopy }) {
    return (
        <div className={`${styles.skuCard} ${sku.status?.toLowerCase() === 'active' ? styles.activeSku : sku.status?.toLowerCase() === 'blocked' ? styles.blockedSku : styles.inactiveSku}`}>
            <div className={styles.skuInfo}>
                <div className={styles.skuMain}>
                    <span className={styles.skuIdLabel}>SKU ID</span>
                    <div className={styles.skuIdWithCopy}>
                        <span className={styles.skuIdValue}>{sku.skuId}</span>
                        <button
                            className={styles.copyButtonSmall}
                            onClick={() => onCopy(sku.skuId, "SKU ID")}
                            title="Copy SKU ID"
                        >
                            <Icon name="copy-inventory-id" size={14} />
                        </button>
                    </div>
                    <span className={`${styles.statusBadge} ${sku.status?.toLowerCase() === 'active' ? styles.activeStatus : sku.status?.toLowerCase() === 'blocked' ? styles.blockedStatus : styles.inactiveStatus}`}>
                        {sku.status?.charAt(0).toUpperCase() + sku.status?.slice(1)}
                    </span>
                </div>
                <div className={styles.skuBadges}>
                    <span className={styles.marketplaceBadge}>{sku.marketplace}</span>
                    <span className={styles.netSoldBadge}>Sold: {sku.netSold}</span>
                </div>
            </div>

            {/* Combo Items */}
            {sku.comboItems && sku.comboItems.length > 0 && (
                <div className={styles.comboSection}>
                    <span className={styles.comboLabel}>Combo Items</span>
                    <div className={styles.comboGrid}>
                        {sku.comboItems.map((combo, cIndex) => (
                            <div key={cIndex} className={styles.comboItem}>
                                <div className={styles.comboImageWrapper}>
                                    {combo.imageUrl ? (
                                        <Image
                                            src={combo.imageUrl}
                                            alt={combo.inventoryId}
                                            fill
                                            className={styles.comboImg}
                                            unoptimized
                                        />
                                    ) : (
                                        <div className={styles.comboPlaceholder}>NA</div>
                                    )}
                                </div>
                                <div className={styles.comboIdContainer}>
                                    <span className={styles.comboId}>{combo.inventoryId}</span>
                                    <button
                                        className={styles.copyButtonTiny}
                                        onClick={() => onCopy(combo.inventoryId, "Combo Inventory ID")}
                                        title="Copy ID"
                                    >
                                        <Icon name="copy-inventory-id" size={12} />
                                    </button>
                                </div>
                                <div className={styles.comboQuantity}>
                                    <span className={styles.comboQtyLabel}>Stock: </span>
                                    <span className={styles.comboQtyValue}>{combo.currentStock}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
