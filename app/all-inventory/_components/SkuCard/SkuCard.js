import Image from "next/image";
import Badge from "@/components/ui/Badge/Badge";
import IconButton from "@/components/ui/IconButton/IconButton";
import cx from "@/components/ui/cx";
import styles from "./SkuCard.module.css";

const statusTones = { active: "success", blocked: "warning" };

export default function SkuCard({ sku, onCopy }) {
    const status = sku.status?.toLowerCase();
    return (
        <div className={cx(styles.root, status === 'blocked' && styles.isBlocked, status !== 'active' && status !== 'blocked' && styles.isInactive)}>
            <div className={styles.info}>
                <div className={styles.main}>
                    <span className={styles.idLabel}>SKU ID</span>
                    <div className={styles.idRow}>
                        <span className={styles.idValue}>{sku.skuId}</span>
                        <IconButton
                            name="copy-inventory-id"
                            size="sm"
                            className={styles.copy}
                            onClick={() => onCopy(sku.skuId, "SKU ID")}
                            title="Copy SKU ID"
                            aria-label="Copy SKU ID"
                        />
                    </div>
                    <Badge tone={statusTones[status] || "danger"} className={styles.status}>
                        {sku.status?.charAt(0).toUpperCase() + sku.status?.slice(1)}
                    </Badge>
                </div>
                <div className={styles.badges}>
                    <Badge tone="info">{sku.marketplace}</Badge>
                    <Badge tone="neutral" className={styles.sold}>Sold: {sku.netSold}</Badge>
                </div>
            </div>

            {/* Combo Items */}
            {sku.comboItems && sku.comboItems.length > 0 && (
                <div className={styles.combo}>
                    <span className={styles.comboLabel}>Combo Items</span>
                    <div className={styles.comboGrid}>
                        {sku.comboItems.map((combo, cIndex) => (
                            <div key={cIndex} className={styles.comboItem}>
                                <div className={styles.comboMedia}>
                                    {combo.imageUrl ? (
                                        <Image
                                            src={combo.imageUrl}
                                            alt={combo.inventoryId}
                                            fill
                                            sizes="3.75rem"
                                            className={styles.comboImage}
                                        />
                                    ) : (
                                        <span className={styles.comboPlaceholder}>NA</span>
                                    )}
                                </div>
                                <div className={styles.comboIdRow}>
                                    <span className={styles.comboId}>{combo.inventoryId}</span>
                                    <IconButton
                                        name="copy-inventory-id"
                                        size="sm"
                                        className={styles.copy}
                                        onClick={() => onCopy(combo.inventoryId, "Combo Inventory ID")}
                                        title="Copy ID"
                                        aria-label="Copy ID"
                                    />
                                </div>
                                <div className={styles.comboStock}>
                                    <span>Stock: </span>
                                    <span className={styles.comboStockValue}>{combo.currentStock}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
