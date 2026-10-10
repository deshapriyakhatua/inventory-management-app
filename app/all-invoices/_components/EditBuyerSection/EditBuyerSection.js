import { GST_STATES } from "@/utils/gstStates";
import styles from "./EditBuyerSection.module.css";

// onBuyerFieldChange(field, value) merges into editingInvoice.buyerDetails (page.js).
export default function EditBuyerSection({ editingInvoice, onBuyerFieldChange }) {
  return (
    <>
      <div className={styles.modalSectionTitle}>Customer / Buyer Info</div>
      <div className={styles.modalGrid}>
        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>Customer Name</label>
          <input
            type="text"
            className={styles.modalInput}
            value={editingInvoice.buyerDetails?.businessName || ""}
            onChange={(e) => onBuyerFieldChange("businessName", e.target.value)}
            required
          />
        </div>

        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>Contact No</label>
          <input
            type="text"
            className={styles.modalInput}
            value={editingInvoice.buyerDetails?.phoneNo || ""}
            onChange={(e) => onBuyerFieldChange("phoneNo", e.target.value)}
            placeholder="e.g. +91 9876543210"
          />
        </div>

        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>GSTIN</label>
          <input
            type="text"
            className={styles.modalInput}
            value={editingInvoice.buyerDetails?.gstNo || ""}
            onChange={(e) => onBuyerFieldChange("gstNo", e.target.value)}
          />
        </div>

        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>Address</label>
          <input
            type="text"
            className={styles.modalInput}
            value={editingInvoice.buyerDetails?.address || ""}
            onChange={(e) => onBuyerFieldChange("address", e.target.value)}
          />
        </div>

        <div className={styles.modalInputGroup}>
          <label className={styles.modalLabel}>State</label>
          <select
            className={styles.modalSelect}
            value={editingInvoice.buyerDetails?.state || "19-West Bengal"}
            onChange={(e) => onBuyerFieldChange("state", e.target.value)}
          >
            {GST_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
