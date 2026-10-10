import Checkbox from "@/components/ui/Checkbox/Checkbox";
import Input from "@/components/ui/Input/Input";
import cx from "@/components/ui/cx";
import styles from "./PaymentSection.module.css";

// Received / Balance / QR toggle rows. Rendered inside TaxSummary's summary box.
export default function PaymentSection({
  receivedAmount,
  balanceAmount,
  showQrCode,
  onReceivedAmountChange,
  onShowQrCodeChange,
}) {
  return (
    <>
      <label className={styles.summaryRow}>
        <span>Received (₹):</span>
        <Input
          type="number"
          step="0.01"
          className={styles.amountInput}
          value={receivedAmount}
          onChange={onReceivedAmountChange}
        />
      </label>
      <div className={cx(styles.summaryRow, styles.balanceRow)}>
        <span>Balance:</span>
        <span className={styles.amount}>₹{balanceAmount.toFixed(2)}</span>
      </div>
      <div className={cx(styles.summaryRow, styles.qrRow)}>
        <label className={styles.qrToggle}>
          <Checkbox checked={showQrCode} onChange={onShowQrCodeChange} />
          <span>Show QR Code on Invoice</span>
        </label>
      </div>
    </>
  );
}
