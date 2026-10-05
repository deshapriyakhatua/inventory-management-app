import Image from "next/image";
import Icon from "@/components/ui/Icon/Icon";
import { parseSearchQuery, matchesSearchTerms } from "../../../../utils/searchUtils";
import styles from "./InventoryPickerModal.module.css";

export default function InventoryPickerModal({
    selectedInventoryIds,
    inventoryPickerItems,
    inventoryPickerLoading,
    inventoryPickerSearch,
    onSearchChange,
    onClearSearch,
    onToggleItem,
    onClose,
}) {
    return (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }} onClick={onClose}>
            <div className={styles.inventoryPickerModal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2>Select Inventory</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                            {selectedInventoryIds.length} selected
                        </p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <Icon name="remove-this-product" />
                    </button>
                </div>

                <div className={styles.inventoryPickerSearch}>
                    <Icon name="icon-9c4a10ac" size={16} style={{flexShrink:0,color:'#64748b'}} />
                    <input
                        type="text"
                        placeholder="Search inventory ID..."
                        className={styles.inventoryPickerSearchInput}
                        value={inventoryPickerSearch}
                        onChange={onSearchChange}
                        autoFocus
                    />
                    {inventoryPickerSearch && (
                        <button className={styles.pickerSearchClear} onClick={onClearSearch}>×</button>
                    )}
                </div>

                <div className={styles.inventoryPickerGridContainer}>
                    <div className={styles.inventoryPickerGrid}>
                        {inventoryPickerLoading ? (
                            <div className={styles.inventoryPickerLoading}>
                                <div className={styles.spinner} />
                                <p>Loading inventory...</p>
                            </div>
                        ) : (() => {
                            const filtered = inventoryPickerItems.filter(inv => {
                                if (!inventoryPickerSearch) return true;
                                const { includeTerms, excludeTerms } = parseSearchQuery(inventoryPickerSearch);
                                return matchesSearchTerms(inv.inventoryId, includeTerms, excludeTerms);
                            });
                            return filtered.length === 0 ? (
                                <p className={styles.inventoryPickerEmpty}>No inventory items found.</p>
                            ) : filtered.map(inv => {
                                const isSelected = selectedInventoryIds.includes(inv.inventoryId);
                                return (
                                    <div
                                        key={inv.inventoryId}
                                        className={`${styles.inventoryPickerCard} ${isSelected ? styles.inventoryPickerCardSelected : ''}`}
                                        onClick={() => onToggleItem(inv.inventoryId)}
                                    >
                                        <div className={styles.inventoryPickerImageWrap}>
                                            {inv.imageUrl ? (
                                                <Image
                                                    src={inv.imageUrl}
                                                    alt={inv.inventoryId}
                                                    referrerPolicy="no-referrer"
                                                    fill
                                                    className={styles.inventoryPickerImage}
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className={styles.inventoryPickerNoImage}>
                                                    <Icon name="icon-a992d83c" />
                                                </div>
                                            )}
                                            {isSelected && (
                                                <div className={styles.inventoryPickerCheckmark}>
                                                    <Icon name="icon-5ab11cbf" size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <p className={styles.inventoryPickerCardId}>{inv.inventoryId}</p>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                <div className={styles.inventoryPickerFooter}>
                    <span className={styles.inventoryPickerCount}>
                        {selectedInventoryIds.length} item{selectedInventoryIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <button className={styles.saveBtn} onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
