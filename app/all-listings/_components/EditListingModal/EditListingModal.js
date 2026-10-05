import Icon from "@/components/ui/Icon/Icon";
import MarketplaceLogo from "../../../../components/MarketplaceLogo/MarketplaceLogo";
import StatusDot from "../StatusDot/StatusDot";
import { STATUS_COLORS } from "../../allListingsConfig";
import styles from "./EditListingModal.module.css";

export default function EditListingModal({
    editingListing,
    editForm,
    verticals,
    editSaving,
    onStatusChange,
    onMarketplaceChange,
    onStyleIdChange,
    onVerticalChange,
    onRemoveInventoryItem,
    onOpenInventoryPicker,
    onSave,
    onClose,
}) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.editModalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2>Edit Listing</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{editingListing.skuId}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <Icon name="remove-this-product" />
                    </button>
                </div>

                <div className={styles.editModalBody}>
                    {/* Status */}
                    <div className={styles.editField}>
                        <label className={styles.editLabel}>Status</label>
                        <div className={styles.editStatusGrid}>
                            {['active', 'inactive', 'blocked', 'archived'].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    className={`${styles.statusPill} ${editForm.status === s ? styles.statusPillActive : ''}`}
                                    style={editForm.status === s ? { borderColor: STATUS_COLORS[s]?.dot, color: STATUS_COLORS[s]?.label, backgroundColor: `${STATUS_COLORS[s]?.dot}18` } : {}}
                                    onClick={() => onStatusChange(s)}
                                >
                                    <StatusDot status={s} size={7} />
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Marketplace */}
                    <div className={styles.editField}>
                        <label className={styles.editLabel}>Marketplace</label>
                        <div className={styles.editMarketplaceGrid}>
                            {['Amazon', 'Flipkart', 'Myntra', 'Meesho', 'Ajio', 'Shopsy', 'Website', 'Direct'].map(mp => (
                                <button
                                    key={mp}
                                    type="button"
                                    className={`${styles.marketplacePill} ${editForm.marketplace === mp ? styles.marketplacePillActive : ''}`}
                                    onClick={() => onMarketplaceChange(mp)}
                                >
                                    <MarketplaceLogo marketplace={mp} size={18} />
                                    <span>{mp}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Style ID (Myntra) */}
                    {editForm.marketplace === "Myntra" && (
                        <div className={styles.editField}>
                            <label className={styles.editLabel}>Style ID (Myntra)</label>
                            <input
                                type="text"
                                className={styles.editInput}
                                value={editForm.styleId || ""}
                                onChange={onStyleIdChange}
                                placeholder="e.g., 29481052"
                            />
                        </div>
                    )}

                    {/* Vertical */}
                    <div className={styles.editField}>
                        <label className={styles.editLabel}>Vertical</label>
                        <div className={styles.editVerticalGrid}>
                            {verticals.map(v => {
                                const isSelected = editForm.vertical === v.verticalName;
                                return (
                                    <button
                                        key={v.verticalShort || v.verticalName}
                                        type="button"
                                        className={`${styles.verticalPill} ${isSelected ? styles.verticalPillActive : ''}`}
                                        onClick={() => onVerticalChange(v.verticalName)}
                                    >
                                        <span className={styles.verticalBadge}>{v.verticalShort}</span>
                                        <span className={styles.verticalName}>{v.verticalName}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Inventory Items */}
                    <div className={styles.editField}>
                        <label className={styles.editLabel}>Inventory IDs</label>
                        <div className={styles.editInventoryTags}>
                            {editForm.inventoryItems.map((id) => (
                                <span key={id} className={styles.inventoryTag}>
                                    {id}
                                    <button
                                        type="button"
                                        className={styles.removeTagBtn}
                                        onClick={() => onRemoveInventoryItem(id)}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            {editForm.inventoryItems.length === 0 && (
                                <span className={styles.inventoryTagEmpty}>No items selected</span>
                            )}
                        </div>
                        <button
                            type="button"
                            className={styles.addTagBtn}
                            onClick={onOpenInventoryPicker}
                        >
                            <Icon name="add-another-product" size={14} />
                            Select from Inventory
                        </button>
                    </div>

                </div>

                <div className={styles.editModalFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button className={styles.saveBtn} onClick={onSave} disabled={editSaving}>
                        {editSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
