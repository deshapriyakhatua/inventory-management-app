import Icon from "@/components/ui/Icon/Icon";
import styles from "./InvoiceActionsMenu.module.css";

// 3-dot dropdown for one invoice row. The wrapper keeps the `data-action-menu`
// attribute that page.js's document click-outside listener relies on.
export default function InvoiceActionsMenu({
  inv,
  showArchived,
  isOpen,
  onToggle,
  onGraphical,
  onPdf,
  onPaymentQr,
  onEdit,
  onArchive,
  onRestore,
  onPermanentDelete,
}) {
  return (
    <div className={styles.actionMenuWrapper} data-action-menu>
      <button
        type="button"
        className={styles.threeDotsBtn}
        onClick={(e) => onToggle(e, inv._id)}
        title="Actions"
      >
        <Icon name="actions" size={18} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {!showArchived ? (
            <>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => onGraphical(inv)}
              >
                <Icon name="view-graphical" size={15} />
                View (Graphical)
              </button>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => onPdf(inv)}
              >
                <Icon name="pdf-preview" size={15} />
                PDF Preview
              </button>
              {(inv.paymentStatus === "Pending" ||
                inv.paymentStatus === "Partially Paid" ||
                (inv.balanceAmount !== undefined
                  ? inv.balanceAmount > 0
                  : (inv.grandTotal || 0) - (inv.receivedAmount || 0) > 0)) && (
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => onPaymentQr(inv)}
                >
                  <Icon name="payment-qr-balance" size={15} />
                  Payment QR (Balance)
                </button>
              )}
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => onEdit(inv)}
              >
                <Icon name="edit-inventory" size={15} />
                Edit Invoice
              </button>
              <div className={styles.dropdownDivider} />
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                onClick={() => onArchive(inv)}
              >
                <Icon name="trash" size={15} />
                Archive
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => onGraphical(inv)}
              >
                <Icon name="view-graphical" size={15} />
                View (Graphical)
              </button>
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => onPdf(inv)}
              >
                <Icon name="pdf-preview" size={15} />
                PDF Preview
              </button>
              {(inv.paymentStatus === "Pending" ||
                inv.paymentStatus === "Partially Paid" ||
                (inv.balanceAmount !== undefined
                  ? inv.balanceAmount > 0
                  : (inv.grandTotal || 0) - (inv.receivedAmount || 0) > 0)) && (
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => onPaymentQr(inv)}
                >
                  <Icon name="payment-qr-balance" size={15} />
                  Payment QR (Balance)
                </button>
              )}
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => onRestore(inv)}
              >
                <Icon name="restore-invoice" size={15} />
                Restore Invoice
              </button>
              <div className={styles.dropdownDivider} />
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                onClick={() => onPermanentDelete(inv)}
              >
                <Icon name="trash" size={15} />
                Delete Permanently
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
