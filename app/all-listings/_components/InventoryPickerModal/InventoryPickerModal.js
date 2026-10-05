import Image from "next/image";
import Button from "@/components/ui/Button/Button";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal/Modal";
import Spinner from "@/components/ui/Spinner/Spinner";
import cx from "@/components/ui/cx";
import { parseSearchQuery, matchesSearchTerms } from "@/utils/searchUtils";
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
    const filtered = inventoryPickerItems.filter(inv => {
        if (!inventoryPickerSearch) return true;
        const { includeTerms, excludeTerms } = parseSearchQuery(inventoryPickerSearch);
        return matchesSearchTerms(inv.inventoryId, includeTerms, excludeTerms);
    });

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title="Select Inventory"
            description={`${selectedInventoryIds.length} selected`}
        >
            <div className={styles.root}>
                <Input
                    type="text"
                    aria-label="Search inventory ID..."
                    placeholder="Search inventory ID..."
                    value={inventoryPickerSearch}
                    onChange={onSearchChange}
                    data-autofocus
                    leading={<Icon name="icon-9c4a10ac" size={16} />}
                    trailing={inventoryPickerSearch ? (
                        <IconButton
                            name="remove-this-product"
                            size="sm"
                            aria-label="Clear search"
                            onClick={onClearSearch}
                        />
                    ) : null}
                />

                {inventoryPickerLoading ? (
                    <div className={styles.status}>
                        <Spinner label="Loading inventory" />
                        <span>Loading inventory...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<Icon name="icon-9c4a10ac" size={40} />}
                        title="No inventory items found."
                    />
                ) : (
                    <div className={styles.grid}>
                        {filtered.map(inv => {
                            const isSelected = selectedInventoryIds.includes(inv.inventoryId);
                            return (
                                <button
                                    key={inv.inventoryId}
                                    type="button"
                                    aria-pressed={isSelected}
                                    className={cx(styles.card, isSelected && styles.cardSelected)}
                                    onClick={() => onToggleItem(inv.inventoryId)}
                                >
                                    <span className={styles.media}>
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
                                            <span className={styles.noImage}>
                                                <Icon name="icon-a992d83c" />
                                            </span>
                                        )}
                                        {isSelected && (
                                            <span className={styles.tick}>
                                                <Icon name="icon-5ab11cbf" size={14} />
                                            </span>
                                        )}
                                    </span>
                                    <span className={styles.cardId}>{inv.inventoryId}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className={styles.footer}>
                    <span className={styles.count}>
                        {selectedInventoryIds.length} item{selectedInventoryIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button onClick={onClose}>
                        Done
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
