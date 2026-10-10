import Table from "@/components/ui/Table/Table";
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
    <Table.Row>
      <Table.Cell className={styles.invNumber}>{inv.invoiceNumber}</Table.Cell>
      <Table.Cell className={styles.nowrap}>{inv.invoiceDate ? formatDateGB(inv.invoiceDate) : "-"}</Table.Cell>
      <Table.Cell className={styles.customerName}>
        {inv.buyerDetails?.businessName || "N/A"}
      </Table.Cell>
      <Table.Cell className={styles.nowrap}>{inv.lineItems?.length || 0} items</Table.Cell>
      <Table.Cell numeric className={styles.grandTotal}>
        ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
      </Table.Cell>
      <Table.Cell numeric>₹{(inv.receivedAmount || 0).toLocaleString("en-IN")}</Table.Cell>
      <Table.Cell numeric className={invBalance > 0 ? styles.balanceDue : styles.balanceClear}>
        ₹{invBalance.toLocaleString("en-IN")}
      </Table.Cell>
      <Table.Cell>
        <StatusBadge status={inv.paymentStatus} />
      </Table.Cell>
      <Table.Cell>
        <InvoiceActionsMenu
          inv={inv}
          showArchived={showArchived}
          isOpen={isMenuOpen}
          {...menuHandlers}
        />
      </Table.Cell>
    </Table.Row>
  );
}
