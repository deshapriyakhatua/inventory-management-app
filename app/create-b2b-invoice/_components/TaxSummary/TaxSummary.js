import Button from "@/components/ui/Button/Button";
import Input from "@/components/ui/Input/Input";
import cx from "@/components/ui/cx";
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
            <span className={styles.amount}>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>GST Total:</span>
            <span className={styles.amount}>₹{totalGst.toFixed(2)}</span>
          </div>
          <label className={styles.summaryRow}>
            <span>Shipping (₹):</span>
            <Input
              type="number"
              step="0.01"
              className={styles.amountInput}
              value={shippingFee}
              onChange={onShippingFeeChange}
            />
          </label>
          <label className={styles.summaryRow}>
            <span>Discount (₹):</span>
            <Input
              type="number"
              step="0.01"
              className={styles.amountInput}
              value={discount}
              onChange={onDiscountChange}
            />
          </label>
          <div className={cx(styles.summaryRow, styles.grandTotalRow)}>
            <span>Total:</span>
            <span className={styles.amount}>₹{grandTotal.toFixed(2)}</span>
          </div>
          {children}
        </div>
      </div>

      <Button type="submit" size="lg" className={styles.submitButton} loading={isSubmitting}>
        {isSubmitting ? "Saving Invoice..." : "Save Invoice & Preview PDF"}
      </Button>
    </FormCard>
  );
}
