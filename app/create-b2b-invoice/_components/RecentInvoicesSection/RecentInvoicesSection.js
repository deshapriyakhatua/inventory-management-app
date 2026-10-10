import Icon from "@/components/ui/Icon/Icon";
import RecentInvoiceRow from "../RecentInvoiceRow/RecentInvoiceRow";
import styles from "./RecentInvoicesSection.module.css";

// History Section
export default function RecentInvoicesSection({
  recentInvoices,
  isLoadingHistory,
  onRefresh,
  onOpenGraphicalModal,
  onOpenPdfModal,
  onOpenPaymentQrModal,
}) {
  return (
    <div className={styles.recentSection}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 className={styles.recentTitle} style={{ marginBottom: 0 }}>
          Recent B2B Invoices ({recentInvoices.length})
        </h2>
        <button
          type="button"
          className={styles.tabBtn}
          onClick={onRefresh}
          disabled={isLoadingHistory}
        >
          <Icon name="refresh" size={16} />
          Refresh History
        </button>
      </div>

      <table className={styles.invoiceListTable}>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Grand Total</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {recentInvoices.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", color: "#a1a1aa", padding: "20px" }}>
                {isLoadingHistory ? "Loading invoices..." : "No B2B invoices generated yet."}
              </td>
            </tr>
          ) : (
            recentInvoices.map((inv) => (
              <RecentInvoiceRow
                key={inv._id}
                inv={inv}
                onOpenGraphicalModal={onOpenGraphicalModal}
                onOpenPdfModal={onOpenPdfModal}
                onOpenPaymentQrModal={onOpenPaymentQrModal}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
