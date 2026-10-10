import { formatDateGB } from "../../allInvoicesUtils";
import InvoiceActionsMenu from "../InvoiceActionsMenu/InvoiceActionsMenu";
import StatusBadge from "../StatusBadge/StatusBadge";
import styles from "./InvoiceRow.module.css";

export default function InvoiceRow({ inv, showArchived, isMenuOpen, menuHandlers }) {
  const invBalance =
    inv.balanceAmount !== undefined && inv.balanceAmount !== null && inv.balanceAmount !== 0
      ? inv.balanceAmount
      : Math.max(0, (inv.grandTotal || 0) - (inv.receivedAmount || 0));

  return (
    <tr>
      <td className={styles.invNumber}>{inv.invoiceNumber}</td>
      <td>{inv.invoiceDate ? formatDateGB(inv.invoiceDate) : "-"}</td>
      <td className={styles.customerName}>
        {inv.buyerDetails?.businessName || "N/A"}
      </td>
      <td>{inv.lineItems?.length || 0} items</td>
      <td style={{ fontWeight: "700", color: "#34d399" }}>
        ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
      </td>
      <td>₹{(inv.receivedAmount || 0).toLocaleString("en-IN")}</td>
      <td style={{ fontWeight: "600", color: invBalance > 0 ? "#f87171" : "#a1a1aa" }}>
        ₹{invBalance.toLocaleString("en-IN")}
      </td>
      <td>
        <StatusBadge status={inv.paymentStatus} />
      </td>
      <td style={{ position: "relative" }}>
        <InvoiceActionsMenu
          inv={inv}
          showArchived={showArchived}
          isOpen={isMenuOpen}
          {...menuHandlers}
        />
      </td>
    </tr>
  );
}
