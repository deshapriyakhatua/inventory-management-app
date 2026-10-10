import styles from "./EditPaymentSection.module.css";

export default function EditPaymentSection({
  editingInvoice,
  onUpiIdChange,
  onShippingFeeChange,
  onDiscountChange,
  onReceivedAmountChange,
}) {
  return (
    <>
      <div className={styles.modalSectionTitle}>Payment & Totals</div>
      <div className={styles.modalGrid}>
        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>UPI Barcode / UPI ID</label>
          <input
            type="text"
            className={styles.modalInput}
            value={editingInvoice.sellerDetails?.upiId || ""}
            onChange={onUpiIdChange}
            placeholder="e.g. 033311501063323@slice"
          />
        </div>

        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>Shipping Fee (₹)</label>
          <input
            type="number"
            step="0.01"
            className={styles.modalInput}
            value={editingInvoice.shippingFee || 0}
            onChange={onShippingFeeChange}
          />
        </div>

        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>Discount (₹)</label>
          <input
            type="number"
            step="0.01"
            className={styles.modalInput}
            value={editingInvoice.discount || 0}
            onChange={onDiscountChange}
          />
        </div>

        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>Received Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            className={styles.modalInput}
            value={editingInvoice.receivedAmount || 0}
            onChange={onReceivedAmountChange}
          />
        </div>
      </div>
    </>
  );
}
