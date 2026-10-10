import Icon from "@/components/ui/Icon/Icon";
import { formatDateGB } from "../../createB2bInvoiceUtils";
import StatusBadge from "../StatusBadge/StatusBadge";
import styles from "./RecentInvoiceRow.module.css";

export default function RecentInvoiceRow({
  inv,
  onOpenGraphicalModal,
  onOpenPdfModal,
  onOpenPaymentQrModal,
}) {
  return (
    <tr>
      <td style={{ fontWeight: "700", color: "#60a5fa" }}>
        {inv.invoiceNumber}
      </td>
      <td>
        {inv.invoiceDate ? formatDateGB(inv.invoiceDate) : "-"}
      </td>
      <td>{inv.buyerDetails?.businessName || "N/A"}</td>
      <td>{inv.lineItems?.length || 0} items</td>
      <td style={{ fontWeight: "700", color: "#34d399" }}>
        ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
      </td>
      <td style={{ fontWeight: "600", color: "#f87171" }}>
        ₹{(inv.balanceAmount || 0).toLocaleString("en-IN")}
      </td>
      <td>
        <StatusBadge status={inv.paymentStatus} />
      </td>
      <td>
        <div className={styles.recentActionGroup}>
          <button
            type="button"
            className={styles.recentViewBtn}
            onClick={() => onOpenGraphicalModal(inv)}
            title="View Graphical Invoice & Inventory Images"
          >
            <Icon name="view-graphical" size={14} />
            View
          </button>
          <button
            type="button"
            className={styles.recentPdfBtn}
            onClick={() => onOpenPdfModal(inv)}
            title="View & Download Invoice PDF"
          >
            <Icon name="view-and-download-invoice-pdf" size={14} />
            PDF
          </button>
          {(inv.paymentStatus === "Pending" ||
            inv.paymentStatus === "Partially Paid" ||
            (inv.balanceAmount !== undefined
              ? inv.balanceAmount > 0
              : (inv.grandTotal || 0) - (inv.receivedAmount || 0) > 0)) && (
            <button
              type="button"
              className={styles.recentQrBtn}
              onClick={() => onOpenPaymentQrModal(inv)}
              title="Generate Custom Payment QR for Remaining Balance"
            >
              <Icon name="payment-qr-balance" size={14} />
              Payment QR
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
