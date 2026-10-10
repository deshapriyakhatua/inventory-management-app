import Icon from "@/components/ui/Icon/Icon";
import { GST_STATES } from "@/utils/gstStates";
import PickerModalHeader from "../PickerModalHeader/PickerModalHeader";
import styles from "./CompanySettingsModal.module.css";

// Company Details, Bank & Terms Modal
export default function CompanySettingsModal({
  sellerDetails,
  notes,
  isSavingCompany,
  onSellerFieldChange,
  onNotesChange,
  onSave,
  onClose,
}) {
  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div className={styles.companyModal} onClick={(e) => e.stopPropagation()}>
        <PickerModalHeader
          title="Company, Bank & Terms Settings"
          subtitle="Pre-filled seller information, payment bank details, and invoice terms."
          onClose={onClose}
        />

        <div className={styles.companyModalBody}>
          {/* Company Details */}
          <div>
            <div className={styles.modalSubSectionTitle}>
              <Icon name="icon-d5851a0c" size={18} />
              Company Details
            </div>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Company Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={sellerDetails.businessName}
                  onChange={(e) => onSellerFieldChange("businessName", e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Address</label>
                <input
                  type="text"
                  className={styles.input}
                  value={sellerDetails.address}
                  onChange={(e) => onSellerFieldChange("address", e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>State</label>
                <select
                  className={styles.select}
                  value={sellerDetails.state || "19-West Bengal"}
                  onChange={(e) => onSellerFieldChange("state", e.target.value)}
                >
                  {GST_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>GSTIN</label>
                <input
                  type="text"
                  className={styles.input}
                  value={sellerDetails.gstNo}
                  onChange={(e) => onSellerFieldChange("gstNo", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bank & Payment Details */}
          <div>
            <div className={styles.modalSubSectionTitle} style={{ color: "#10b981" }}>
              <Icon name="icon-3790acba" size={18} />
              Bank & Payment Details
            </div>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Bank Name</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Slice Small Finance Bank"
                  value={sellerDetails.bankName}
                  onChange={(e) => onSellerFieldChange("bankName", e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Account Number</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 033311501063323"
                  value={sellerDetails.accountNo}
                  onChange={(e) => onSellerFieldChange("accountNo", e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>IFSC Code</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. NESF0000333"
                  value={sellerDetails.ifscCode}
                  onChange={(e) => onSellerFieldChange("ifscCode", e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>UPI Barcode / UPI ID</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 033311501063323@slice"
                  value={sellerDetails.upiId || ""}
                  onChange={(e) => onSellerFieldChange("upiId", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div>
            <div className={styles.modalSubSectionTitle} style={{ color: "#f59e0b" }}>
              <Icon name="view-and-download-invoice-pdf" size={18} />
              Notes & Terms
            </div>
            <div className={styles.inputGroup}>
              <textarea
                rows="4"
                className={styles.textarea}
                value={notes}
                onChange={onNotesChange}
                placeholder="Terms & Conditions or notes..."
              />
            </div>
          </div>
        </div>

        <div className={styles.companyModalFooter}>
          <button
            type="button"
            className={styles.companyModalSaveBtn}
            onClick={onSave}
            disabled={isSavingCompany}
          >
            {isSavingCompany ? "Saving..." : "Save & Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
