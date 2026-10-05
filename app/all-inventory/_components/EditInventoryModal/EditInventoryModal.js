import Icon from "@/components/ui/Icon/Icon";
import styles from "./EditInventoryModal.module.css";

export default function EditInventoryModal({
    editForm,
    verticals,
    editSaving,
    onChange,
    onSubmit,
    onClose,
}) {
    return (
        <div className={styles.confirmOverlay} onClick={onClose}>
            <div className={styles.confirmModal} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.confirmHeader}>
                    <div style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                        <Icon name="edit-inventory" />
                    </div>
                    <h3 className={styles.confirmTitle}>Edit Inventory Item</h3>
                </div>

                <form onSubmit={onSubmit} className={styles.editModalForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Inventory ID / SKU</label>
                        <input
                            type="text"
                            name="inventoryId"
                            value={editForm.inventoryId}
                            onChange={onChange}
                            className={styles.formInput}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Vertical</label>
                        <select
                            name="vertical"
                            value={editForm.vertical}
                            onChange={onChange}
                            className={styles.formSelect}
                            required
                        >
                            <option value="">Select Vertical</option>
                            {verticals.map(v => (
                                <option key={v.verticalShort} value={v.verticalName}>{v.verticalName}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Inventory Image</label>
                        <div className={styles.imagePreviewWrapper}>
                            {editForm.imagePreview && (
                                <img
                                    src={editForm.imagePreview}
                                    alt="Preview"
                                    className={styles.imagePreview}
                                />
                            )}
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={onChange}
                                className={styles.fileInput}
                            />
                        </div>
                    </div>

                    <div className={styles.editModalFooter}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={onClose}
                            disabled={editSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={editSaving}
                        >
                            {editSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
