import FormCard from "../FormCard/FormCard";
import styles from "./TaxSummary.module.css";

// Card 4: Financial Summary. `children` is the PaymentSection rows, rendered
// at the end of the same summary box (original DOM order).
export default function TaxSummary({
  subtotal,
  totalGst,
  shippingFee,
  discount,
  grandTotal,
  isSubmitting,
  onShippingFeeChange,
  onDiscountChange,
  children,
}) {
  return (
    <FormCard>
      <div className={styles.summaryContainer}>
        {/* Summary Calculations */}
        <div className={styles.summaryBox}>
          <div className={styles.summaryRow}>
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>GST Total:</span>
            <span>₹{totalGst.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping (₹):</span>
            <input
              type="number"
              step="0.01"
              style={{ width: "100px", textAlign: "end" }}
              className={styles.tableInput}
              value={shippingFee}
              onChange={onShippingFeeChange}
            />
          </div>
          <div className={styles.summaryRow}>
            <span>Discount (₹):</span>
            <input
              type="number"
              step="0.01"
              style={{ width: "100px", textAlign: "end" }}
              className={styles.tableInput}
              value={discount}
              onChange={onDiscountChange}
            />
          </div>
          <div className={`${styles.summaryRow} ${styles.grandTotalRow}`}>
            <span>Total:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
          {children}
        </div>
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving Invoice..." : "Save Invoice & Preview PDF"}
      </button>
    </FormCard>
  );
}
