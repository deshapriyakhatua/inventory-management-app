import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import Table from "@/components/ui/Table/Table";
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
    <Table.Row>
      <Table.Cell className={styles.invNumber}>{inv.invoiceNumber}</Table.Cell>
      <Table.Cell className={styles.nowrap}>
        {inv.invoiceDate ? formatDateGB(inv.invoiceDate) : "-"}
      </Table.Cell>
      <Table.Cell>{inv.buyerDetails?.businessName || "N/A"}</Table.Cell>
      <Table.Cell className={styles.nowrap}>{inv.lineItems?.length || 0} items</Table.Cell>
      <Table.Cell numeric className={styles.grandTotal}>
        ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
      </Table.Cell>
      <Table.Cell numeric className={styles.balance}>
        ₹{(inv.balanceAmount || 0).toLocaleString("en-IN")}
      </Table.Cell>
      <Table.Cell>
        <StatusBadge status={inv.paymentStatus} />
      </Table.Cell>
      <Table.Cell>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Icon name="view-graphical" size={14} />}
            onClick={() => onOpenGraphicalModal(inv)}
            title="View Graphical Invoice & Inventory Images"
          >
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Icon name="view-and-download-invoice-pdf" size={14} />}
            onClick={() => onOpenPdfModal(inv)}
            title="View & Download Invoice PDF"
          >
            PDF
          </Button>
          {(inv.paymentStatus === "Pending" ||
            inv.paymentStatus === "Partially Paid" ||
            (inv.balanceAmount !== undefined
              ? inv.balanceAmount > 0
              : (inv.grandTotal || 0) - (inv.receivedAmount || 0) > 0)) && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Icon name="payment-qr-balance" size={14} />}
              onClick={() => onOpenPaymentQrModal(inv)}
              title="Generate Custom Payment QR for Remaining Balance"
            >
              Payment QR
            </Button>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
