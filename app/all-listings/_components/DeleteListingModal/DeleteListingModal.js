import Icon from "@/components/ui/Icon/Icon";
import styles from "./DeleteListingModal.module.css";

export default function DeleteListingModal({
    deletingListing,
    deleteInputText,
    deleteButtonLoading,
    onInputChange,
    onInputKeyDown,
    onConfirm,
    onClose,
}) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.deleteConfirmModalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <Icon name="icon-cfd589e1" size={22} />
                        Confirm Deletion
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <Icon name="remove-this-product" />
                    </button>
                </div>

                <div className={styles.deleteModalBody}>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        Are you sure you want to delete listing <strong style={{ color: '#f8fafc', wordBreak: 'break-all' }}>{deletingListing.skuId}</strong>? This action cannot be undone.
                    </p>
                    <div className={styles.deleteInputGroup}>
                        <label className={styles.deleteInputLabel}>
                            To confirm, type <span className={styles.deleteHighlight}>delete</span> below:
                        </label>
                        <input
                            type="text"
                            className={styles.deleteInput}
                            placeholder="Type 'delete' to confirm"
                            value={deleteInputText}
                            onChange={onInputChange}
                            autoFocus
                            onKeyDown={onInputKeyDown}
                        />
                    </div>
                </div>

                <div className={styles.editModalFooter}>
                    <button
                        className={styles.cancelBtn}
                        onClick={onClose}
                        disabled={deleteButtonLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.deleteConfirmBtn}
                        onClick={onConfirm}
                        disabled={deleteInputText.trim().toLowerCase() !== "delete" || deleteButtonLoading}
                    >
                        {deleteButtonLoading ? "Deleting..." : "Delete Listing"}
                    </button>
                </div>
            </div>
        </div>
    );
}
