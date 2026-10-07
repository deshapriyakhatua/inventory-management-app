import Icon from "@/components/ui/Icon/Icon";
import styles from "./EditSellerModal.module.css";

function Field({ label, name, type = "text", placeholder = "", value, onChange, disabled }) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={name} className={styles.label}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder || label}
        className={styles.input}
        disabled={disabled}
      />
    </div>
  );
}

function TextArea({ label, name, placeholder = "", value, onChange, disabled }) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={name} className={styles.label}>{label}</label>
      <textarea
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder || label}
        className={styles.textarea}
        disabled={disabled}
        rows={3}
      />
    </div>
  );
}

export default function EditSellerModal({ editFormData, editLoading, onEditChange, onSubmit, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.editModal}`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <Icon name="remove-this-product" />
        </button>
        <div className={styles.modalScroll}>
          <h2 className={styles.modalTitle} style={{ marginBottom: "1.5rem" }}>Edit Seller Details</h2>
          <form onSubmit={onSubmit} className={styles.editForm}>

            {/* ── Section: Basic Info ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Icon name="icon-4c39cef6" size={18} />
                <h3 className={styles.sectionTitle}>Business Information</h3>
              </div>
              <div className={styles.grid2}>
                <Field label="Business Name *" name="businessName" placeholder="e.g., ABC Traders" value={editFormData.businessName} onChange={onEditChange} disabled={editLoading} />
                <Field label="GST No" name="gstNo" placeholder="e.g., 27ABCDE1234F1Z5" value={editFormData.gstNo} onChange={onEditChange} disabled={editLoading} />
                <Field label="Contact Person" name="contactPerson" placeholder="e.g., Ramesh Kumar" value={editFormData.contactPerson} onChange={onEditChange} disabled={editLoading} />
                <Field label="Email" name="email" type="email" placeholder="e.g., seller@example.com" value={editFormData.email} onChange={onEditChange} disabled={editLoading} />
                <Field label="Shipping Provider" name="shippingProvider" placeholder="e.g., Delhivery" value={editFormData.shippingProvider} onChange={onEditChange} disabled={editLoading} />
              </div>
            </div>

            {/* ── Section: Contact ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Icon name="icon-2d625620" size={18} />
                <h3 className={styles.sectionTitle}>Contact Numbers</h3>
              </div>
              <div className={styles.grid2}>
                <Field label="Phone No" name="phoneNo" placeholder="+91 98765 43210" value={editFormData.phoneNo} onChange={onEditChange} disabled={editLoading} />
                <Field label="WhatsApp No" name="whatsAppNo" placeholder="+91 98765 43210" value={editFormData.whatsAppNo} onChange={onEditChange} disabled={editLoading} />
                <Field label="Alt Phone No" name="altPhoneNo" placeholder="+91 98765 00000" value={editFormData.altPhoneNo} onChange={onEditChange} disabled={editLoading} />
                <Field label="Alt WhatsApp No" name="altWhatsAppNo" placeholder="+91 98765 00000" value={editFormData.altWhatsAppNo} onChange={onEditChange} disabled={editLoading} />
              </div>
            </div>

            {/* ── Section: Address ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Icon name="icon-28f62de3" size={18} />
                <h3 className={styles.sectionTitle}>Address</h3>
              </div>
              <div className={styles.grid1}>
                <TextArea label="Address" name="address" placeholder="Street, Area, City" value={editFormData.address} onChange={onEditChange} disabled={editLoading} />
              </div>
              <div className={styles.grid3}>
                <Field label="Country" name="country" placeholder="e.g., India" value={editFormData.country} onChange={onEditChange} disabled={editLoading} />
                <Field label="State" name="state" placeholder="e.g., Maharashtra" value={editFormData.state} onChange={onEditChange} disabled={editLoading} />
                <Field label="Pin Code" name="pinCode" placeholder="e.g., 400001" value={editFormData.pinCode} onChange={onEditChange} disabled={editLoading} />
              </div>
            </div>

            {/* ── Section: Primary Bank ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Icon name="icon-208b8f70" size={18} />
                <h3 className={styles.sectionTitle}>Primary Banking Details</h3>
              </div>
              <div className={styles.grid2}>
                <Field label="Bank Name" name="bankName" placeholder="e.g., HDFC Bank" value={editFormData.bankName} onChange={onEditChange} disabled={editLoading} />
                <Field label="Account No" name="accountNo" placeholder="e.g., 1234567890" value={editFormData.accountNo} onChange={onEditChange} disabled={editLoading} />
                <Field label="IFSC Code" name="ifscCode" placeholder="e.g., HDFC0001234" value={editFormData.ifscCode} onChange={onEditChange} disabled={editLoading} />
                <Field label="Branch" name="branch" placeholder="e.g., Andheri West" value={editFormData.branch} onChange={onEditChange} disabled={editLoading} />
                <Field label="Account Type" name="accountType" placeholder="e.g., Current, Savings" value={editFormData.accountType} onChange={onEditChange} disabled={editLoading} />
                <Field label="UPI ID" name="upiId" placeholder="e.g., seller@upi" value={editFormData.upiId} onChange={onEditChange} disabled={editLoading} />
              </div>
            </div>

            {/* ── Section: Alternate Bank ── */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <Icon name="icon-208b8f70" size={18} />
                <h3 className={styles.sectionTitle}>Alternate Banking Details</h3>
                <span className={styles.optionalBadge}>Optional</span>
              </div>
              <div className={styles.grid2}>
                <Field label="Alt Bank Name" name="altBankName" placeholder="e.g., SBI" value={editFormData.altBankName} onChange={onEditChange} disabled={editLoading} />
                <Field label="Alt Account No" name="altAccountNo" placeholder="e.g., 00112233" value={editFormData.altAccountNo} onChange={onEditChange} disabled={editLoading} />
                <Field label="Alt IFSC Code" name="altIfscCode" placeholder="e.g., SBIN0001234" value={editFormData.altIfscCode} onChange={onEditChange} disabled={editLoading} />
                <Field label="Alt Branch" name="altBranch" placeholder="e.g., Bandra" value={editFormData.altBranch} onChange={onEditChange} disabled={editLoading} />
                <Field label="Alt Account Type" name="altAccountType" placeholder="e.g., Current" value={editFormData.altAccountType} onChange={onEditChange} disabled={editLoading} />
                <Field label="Alt UPI ID" name="altUpiId" placeholder="e.g., alt@upi" value={editFormData.altUpiId} onChange={onEditChange} disabled={editLoading} />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={editLoading}>Cancel</button>
              <button type="submit" className={styles.saveBtn} disabled={editLoading}>
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
