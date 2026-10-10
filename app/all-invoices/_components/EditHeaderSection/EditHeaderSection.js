import { GST_STATES } from "@/utils/gstStates";
import styles from "./EditHeaderSection.module.css";

export default function EditHeaderSection({
  editingInvoice,
  modalAutoStatus,
  onInvoiceNumberChange,
  onInvoiceDateChange,
  onPlaceOfSupplyChange,
  onPaymentStatusChange,
}) {
  return (
    <>
      <div className={styles.modalSectionTitle}>Invoice Header</div>
      <div className={styles.modalGrid}>
        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>Invoice Number</label>
          <input
            type="text"
            className={styles.modalInput}
            value={editingInvoice.invoiceNumber}
            onChange={onInvoiceNumberChange}
            required
          />
        </div>

        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>Invoice Date</label>
          <input
            type="date"
            className={styles.modalInput}
            value={editingInvoice.invoiceDate || ""}
            onChange={onInvoiceDateChange}
            required
          />
        </div>

        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>Place of Supply</label>
          <select
            className={styles.modalSelect}
            value={editingInvoice.placeOfSupply || "19-West Bengal"}
            onChange={onPlaceOfSupplyChange}
          >
            {GST_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>Payment Status</label>
          <select
            className={styles.modalSelect}
            value={editingInvoice.paymentStatus || "Pending"}
            onChange={onPaymentStatusChange}
          >
            <option
              value="Pending"
              disabled={editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus !== "Pending"}
            >
              Pending {editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus === "Pending" ? "(Auto)" : ""}
            </option>
            <option
              value="Paid"
              disabled={editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus !== "Paid"}
            >
              Paid {editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus === "Paid" ? "(Auto)" : ""}
            </option>
            <option
              value="Partially Paid"
              disabled={editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus !== "Partially Paid"}
            >
              Partially Paid {editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus === "Partially Paid" ? "(Auto)" : ""}
            </option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </>
  );
}
