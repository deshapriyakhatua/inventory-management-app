import { useId } from "react";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import FormField from "@/components/ui/FormField/FormField";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal/Modal";
import cx from "@/components/ui/cx";
import MarketplaceLogo from "@/components/MarketplaceLogo/MarketplaceLogo";
import StatusDot, { statusTone } from "../StatusDot/StatusDot";
import styles from "./EditListingModal.module.css";

const STATUS_ACTIVE_CLASS = {
    success: styles.statusSuccess,
    warning: styles.statusWarning,
    danger: styles.statusDanger,
    neutral: styles.statusNeutral,
};

/* Labelled group for button-based pickers (FormField only wraps a single control). */
function ChoiceGroup({ label, children }) {
    const labelId = useId();
    return (
        <div role="group" aria-labelledby={labelId} className={styles.field}>
            <span id={labelId} className={styles.label}>{label}</span>
            {children}
        </div>
    );
}

export default function EditListingModal({
    editingListing,
    editForm,
    verticals,
    editSaving,
    pickerOpen,
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
        // Hidden (not unmounted state) while the inventory picker is on top, so only one dialog traps focus/Esc
        <Modal open={!pickerOpen} onClose={onClose} size="md" title="Edit Listing" description={editingListing.skuId}>
            <div className={styles.form}>
                <ChoiceGroup label="Status">
                    <div className={styles.statusGrid}>
                        {['active', 'inactive', 'blocked', 'archived'].map(s => (
                            <button
                                key={s}
                                type="button"
                                aria-pressed={editForm.status === s}
                                className={cx(styles.pill, styles.pillRow, editForm.status === s && styles.pillActive, editForm.status === s && STATUS_ACTIVE_CLASS[statusTone(s)])}
                                onClick={() => onStatusChange(s)}
                            >
                                <StatusDot status={s} size="sm" />
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </ChoiceGroup>

                <ChoiceGroup label="Marketplace">
                    <div className={styles.grid}>
                        {['Amazon', 'Flipkart', 'Myntra', 'Meesho', 'Ajio', 'Shopsy', 'Website', 'Direct'].map(mp => (
                            <button
                                key={mp}
                                type="button"
                                aria-pressed={editForm.marketplace === mp}
                                className={cx(styles.pill, editForm.marketplace === mp && styles.pillActive)}
                                onClick={() => onMarketplaceChange(mp)}
                            >
                                <MarketplaceLogo marketplace={mp} size={18} />
                                <span>{mp}</span>
                            </button>
                        ))}
                    </div>
                </ChoiceGroup>

                {editForm.marketplace === "Myntra" && (
                    <FormField label="Style ID (Myntra)">
                        <Input
                            type="text"
                            value={editForm.styleId || ""}
                            onChange={onStyleIdChange}
                            placeholder="e.g., 29481052"
                        />
                    </FormField>
                )}

                <ChoiceGroup label="Vertical">
                    <div className={styles.verticalGrid}>
                        {verticals.map(v => {
                            const isSelected = editForm.vertical === v.verticalName;
                            return (
                                <button
                                    key={v.verticalShort || v.verticalName}
                                    type="button"
                                    aria-pressed={isSelected}
                                    className={cx(styles.pill, isSelected && styles.pillActive)}
                                    onClick={() => onVerticalChange(v.verticalName)}
                                >
                                    <span className={styles.verticalShort}>{v.verticalShort}</span>
                                    <span className={styles.verticalName}>{v.verticalName}</span>
                                </button>
                            );
                        })}
                    </div>
                </ChoiceGroup>

                <ChoiceGroup label="Inventory IDs">
                    <div className={styles.tags}>
                        {editForm.inventoryItems.map((id) => (
                            <Badge key={id} tone="accent" className={styles.tag}>
                                {id}
                                <IconButton
                                    name="remove-this-product"
                                    size="sm"
                                    className={styles.tagRemove}
                                    aria-label={`Remove ${id}`}
                                    onClick={() => onRemoveInventoryItem(id)}
                                />
                            </Badge>
                        ))}
                        {editForm.inventoryItems.length === 0 && (
                            <span className={styles.tagsEmpty}>No items selected</span>
                        )}
                    </div>
                    <div>
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Icon name="add-another-product" size={14} />}
                            onClick={onOpenInventoryPicker}
                        >
                            Select from Inventory
                        </Button>
                    </div>
                </ChoiceGroup>

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={onSave} loading={editSaving}>
                        {editSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
