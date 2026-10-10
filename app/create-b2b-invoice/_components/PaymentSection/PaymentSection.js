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
      <div className={styles.summaryRow}>
        <span>Received (₹):</span>
        <input
          type="number"
          step="0.01"
          style={{ width: "100px", textAlign: "end" }}
          className={styles.tableInput}
          value={receivedAmount}
          onChange={onReceivedAmountChange}
        />
      </div>
      <div className={styles.summaryRow} style={{ fontWeight: "700", color: "#f87171" }}>
        <span>Balance:</span>
        <span>₹{balanceAmount.toFixed(2)}</span>
      </div>
      <div className={styles.summaryRow} style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#e4e4e7", fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={showQrCode}
            onChange={onShowQrCodeChange}
            style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#ec4899" }}
          />
          <span>Show QR Code on Invoice</span>
        </label>
      </div>
    </>
  );
}
