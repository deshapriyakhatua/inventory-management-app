import Icon from "@/components/ui/Icon/Icon";
import { GST_STATES } from "@/utils/gstStates";
import FormCard from "../FormCard/FormCard";
import styles from "./InvoiceMetaSection.module.css";

// Card 1: Invoice Meta
export default function InvoiceMetaSection({
  invoiceNumber,
  invoiceDate,
  placeOfSupply,
  paymentStatus,
  autoPaymentStatus,
  isGeneratingId,
  onInvoiceNumberChange,
  onGenerateId,
  onInvoiceDateChange,
  onPlaceOfSupplyChange,
  onPaymentStatusChange,
}) {
  return (
    <FormCard>
      <h3 className={styles.sectionTitle}>
        <Icon name="icon-f5ba4e77" />
        Invoice Header Info
      </h3>

      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Invoice No</label>
          <div className={styles.idRow}>
            <input
              type="text"
              className={styles.input}
              value={invoiceNumber}
              onChange={onInvoiceNumberChange}
              placeholder="e.g. CZ-A9743"
              required
            />
            <button
              type="button"
              className={styles.generateBtn}
              onClick={onGenerateId}
              disabled={isGeneratingId}
            >
              {isGeneratingId ? "..." : "Generate"}
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Date</label>
          <input
            type="date"
            className={styles.input}
            value={invoiceDate}
            onChange={onInvoiceDateChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Place of Supply</label>
          <select
            className={styles.select}
            value={placeOfSupply}
            onChange={onPlaceOfSupplyChange}
          >
            {GST_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Payment Status</label>
          <select
            className={styles.select}
            value={paymentStatus}
            onChange={onPaymentStatusChange}
          >
            <option
              value="Pending"
              disabled={paymentStatus !== "Cancelled" && autoPaymentStatus !== "Pending"}
            >
              Pending {paymentStatus !== "Cancelled" && autoPaymentStatus === "Pending" ? "(Auto)" : ""}
            </option>
            <option
              value="Paid"
              disabled={paymentStatus !== "Cancelled" && autoPaymentStatus !== "Paid"}
            >
              Paid {paymentStatus !== "Cancelled" && autoPaymentStatus === "Paid" ? "(Auto)" : ""}
            </option>
            <option
              value="Partially Paid"
              disabled={paymentStatus !== "Cancelled" && autoPaymentStatus !== "Partially Paid"}
            >
              Partially Paid {paymentStatus !== "Cancelled" && autoPaymentStatus === "Partially Paid" ? "(Auto)" : ""}
            </option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </FormCard>
  );
}
