import Icon from "@/components/ui/Icon/Icon";
import Avatar from "../Avatar/Avatar";
import DetailRow from "../DetailRow/DetailRow";
import { copy } from "../../allSellersConfig";
import styles from "./SellerDetailModal.module.css";

export default function SellerDetailModal({ selectedSeller, user, onClose, onRestore, onEdit, onArchive }) {
  /* ── Icons ── */
  const iconPhone = <Icon name="icon-2d625620" size={14} />;
  const iconMail = <Icon name="icon-4d0b16f6" size={14} />;
  const iconMap = <Icon name="icon-28f62de3" size={14} />;
  const iconBank = <Icon name="icon-208b8f70" size={14} />;
  const iconShip = <Icon name="icon-d4e3f44f" size={14} />;
  const iconGst = <Icon name="pdf-preview" size={14} />;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <Icon name="remove-this-product" />
        </button>

        <div className={styles.modalScroll}>
          {/* Modal header */}
          <div className={styles.modalHeader}>
            <Avatar name={selectedSeller.businessName} className={styles.avatar} />
            <div>
              <h2 className={styles.modalTitle}>
                {selectedSeller.businessName}
                {selectedSeller.isArchived && (
                  <span style={{ marginLeft: "10px", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", textTransform: "uppercase", verticalAlign: "middle" }}>Archived</span>
                )}
              </h2>
              {selectedSeller.contactPerson && <p className={styles.modalSubtitle}>{selectedSeller.contactPerson}</p>}
              <p className={styles.modalMeta}>
                Added {new Date(selectedSeller.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Sections */}
          <div className={styles.modalSections}>

            {/* Basic Info */}
            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Business Info</h3>
              <DetailRow icon={iconGst} label="GST No" value={selectedSeller.gstNo} onCopy={() => copy(selectedSeller.gstNo, setMsg)} />
              <DetailRow icon={iconMail} label="Email" value={selectedSeller.email} onCopy={() => copy(selectedSeller.email, setMsg)} />
              <DetailRow icon={iconShip} label="Shipping Provider" value={selectedSeller.shippingProvider} />
            </div>

            {/* Contact */}
            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Contact Numbers</h3>
              <DetailRow icon={iconPhone} label="Phone" value={selectedSeller.phoneNo} onCopy={() => copy(selectedSeller.phoneNo, setMsg)} />
              <DetailRow icon={iconPhone} label="WhatsApp" value={selectedSeller.whatsAppNo} onCopy={() => copy(selectedSeller.whatsAppNo, setMsg)} />
              <DetailRow icon={iconPhone} label="Alt Phone" value={selectedSeller.altPhoneNo} onCopy={() => copy(selectedSeller.altPhoneNo, setMsg)} />
              <DetailRow icon={iconPhone} label="Alt WhatsApp" value={selectedSeller.altWhatsAppNo} onCopy={() => copy(selectedSeller.altWhatsAppNo, setMsg)} />
            </div>

            {/* Address */}
            {(selectedSeller.address || selectedSeller.state || selectedSeller.country || selectedSeller.pinCode) && (
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>Address</h3>
                <DetailRow icon={iconMap} label="Address" value={selectedSeller.address} />
                <DetailRow icon={iconMap} label="State" value={selectedSeller.state} />
                <DetailRow icon={iconMap} label="Country" value={selectedSeller.country} />
                <DetailRow icon={iconMap} label="Pin Code" value={selectedSeller.pinCode} />
              </div>
            )}

            {/* Primary Bank */}
            {(selectedSeller.bankName || selectedSeller.accountNo || selectedSeller.upiId) && (
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>Primary Bank</h3>
                <DetailRow icon={iconBank} label="Bank" value={selectedSeller.bankName} />
                <DetailRow icon={iconBank} label="Account No" value={selectedSeller.accountNo} onCopy={() => copy(selectedSeller.accountNo, setMsg)} />
                <DetailRow icon={iconBank} label="IFSC" value={selectedSeller.ifscCode} onCopy={() => copy(selectedSeller.ifscCode, setMsg)} />
                <DetailRow icon={iconBank} label="Branch" value={selectedSeller.branch} />
                <DetailRow icon={iconBank} label="Account Type" value={selectedSeller.accountType} />
                <DetailRow icon={iconBank} label="UPI ID" value={selectedSeller.upiId} onCopy={() => copy(selectedSeller.upiId, setMsg)} />
              </div>
            )}

            {/* Alternate Bank */}
            {(selectedSeller.altBankName || selectedSeller.altAccountNo || selectedSeller.altUpiId) && (
              <div className={styles.modalSection}>
                <h3 className={styles.modalSectionTitle}>Alternate Bank</h3>
                <DetailRow icon={iconBank} label="Bank" value={selectedSeller.altBankName} />
                <DetailRow icon={iconBank} label="Account No" value={selectedSeller.altAccountNo} onCopy={() => copy(selectedSeller.altAccountNo, setMsg)} />
                <DetailRow icon={iconBank} label="IFSC" value={selectedSeller.altIfscCode} onCopy={() => copy(selectedSeller.altIfscCode, setMsg)} />
                <DetailRow icon={iconBank} label="Branch" value={selectedSeller.altBranch} />
                <DetailRow icon={iconBank} label="Account Type" value={selectedSeller.altAccountType} />
                <DetailRow icon={iconBank} label="UPI ID" value={selectedSeller.altUpiId} onCopy={() => copy(selectedSeller.altUpiId, setMsg)} />
              </div>
            )}
          </div>

          {/* Modal actions */}
          <div className={styles.modalActions}>
            {selectedSeller.isArchived && (user?.role === "admin" || user?.role === "superadmin") ? (
              <button
                className={styles.modalRestoreBtn}
                onClick={() => onRestore(selectedSeller._id)}
              >
                <Icon name="restore-inventory" size={16} />
                Restore Seller
              </button>
            ) : (
              !selectedSeller.isArchived && (
                <>
                  <button
                    className={styles.modalEditBtn}
                    onClick={onEdit}
                  >
                    <Icon name="edit-inventory" size={16} />
                    Edit Seller
                  </button>
                  <button
                    className={styles.modalDeleteBtn}
                    onClick={() => onArchive(selectedSeller._id)}
                  >
                    <Icon name="trash" size={16} />
                    Archive Seller
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
