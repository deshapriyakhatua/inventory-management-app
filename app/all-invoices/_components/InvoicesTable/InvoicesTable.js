import InvoiceRow from "../InvoiceRow/InvoiceRow";
import styles from "./InvoicesTable.module.css";

export default function InvoicesTable({ invoices, loading, showArchived, openMenuId, menuHandlers }) {
  return (
    <div className={styles.tableCard}>
      <table className={styles.invoiceTable}>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Grand Total</th>
            <th>Received</th>
            <th>Balance</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan="9" style={{ textAlign: "center", color: "#a1a1aa", padding: "30px" }}>
                {loading ? "Loading invoices..." : "No invoices found matching criteria."}
              </td>
            </tr>
          ) : (
            invoices.map((inv) => (
              <InvoiceRow
                key={inv._id}
                inv={inv}
                showArchived={showArchived}
                isMenuOpen={openMenuId === inv._id}
                menuHandlers={menuHandlers}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
