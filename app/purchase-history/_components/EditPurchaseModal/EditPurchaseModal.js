import styles from "./EditPurchaseModal.module.css";

export default function EditPurchaseModal({ editingData, isSaving, onChange, onCancel, onSave }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Edit Purchase</h2>
        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Date Ordered</label>
            <input type="date" name="orderedOn" value={editingData.orderedOn} onChange={onChange} required />
          </div>
          <div className={styles.rowGroup}>
            <div className={styles.formGroup}>
              <label>Quantity</label>
              <input type="number" name="quantity" value={editingData.quantity} onChange={onChange} min="1" required />
            </div>
            <div className={styles.formGroup}>
              <label>Unit Price (₹)</label>
              <input type="number" name="price" value={editingData.price} onChange={onChange} step="0.01" min="0" required />
            </div>
          </div>
          <div className={styles.rowGroup}>
            <div className={styles.formGroup}>
              <label>Shipping Fee (₹)</label>
              <input type="number" name="shippingFee" value={editingData.shippingFee} onChange={onChange} step="0.01" min="0" />
            </div>
            <div className={styles.formGroup}>
              <label>Tax (%)</label>
              <input type="number" name="taxPercentage" value={editingData.taxPercentage} onChange={onChange} step="0.1" min="0" />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Invoice No</label>
            <input type="text" name="invoiceNo" value={editingData.invoiceNo} onChange={onChange} placeholder="Enter Invoice No" />
          </div>
          <div className={styles.formGroup}>
            <label>Received On (Leave blank if In-Transit)</label>
            <input type="date" name="receivedOn" value={editingData.receivedOn} onChange={onChange} />
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button className={styles.saveBtn} onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
