import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import Modal from "@/components/ui/Modal/Modal";
import Avatar from "../Avatar/Avatar";
import DetailRow from "../DetailRow/DetailRow";
import { copy } from "../../allSellersConfig";
import styles from "./SellerDetailModal.module.css";

function Section({ title, children }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

export default function SellerDetailModal({ selectedSeller, user, onClose, onRestore, onEdit, onArchive }) {
  /* ── Icons ── */
  const iconPhone = <Icon name="icon-2d625620" size={14} />;
  const iconMail = <Icon name="icon-4d0b16f6" size={14} />;
  const iconMap = <Icon name="icon-28f62de3" size={14} />;
  const iconBank = <Icon name="icon-208b8f70" size={14} />;
  const iconShip = <Icon name="icon-d4e3f44f" size={14} />;
  const iconGst = <Icon name="pdf-preview" size={14} />;
  const s = selectedSeller;

  return (
    <Modal open onClose={onClose} size="md" ariaLabel={s.businessName}>
      {/* Modal header */}
      <div className={styles.header}>
        <Avatar name={s.businessName} size="lg" />
        <div className={styles.heading}>
          <h2 className={styles.title}>
            {s.businessName}
            {s.isArchived && <Badge tone="danger" className={styles.archived}>Archived</Badge>}
          </h2>
          {s.contactPerson && <p className={styles.subtitle}>{s.contactPerson}</p>}
          <p className={styles.meta}>
            Added {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className={styles.sections}>
        <Section title="Business Info">
          <DetailRow icon={iconGst} label="GST No" value={s.gstNo} onCopy={() => copy(s.gstNo)} />
          <DetailRow icon={iconMail} label="Email" value={s.email} onCopy={() => copy(s.email)} />
          <DetailRow icon={iconShip} label="Shipping Provider" value={s.shippingProvider} />
        </Section>

        <Section title="Contact Numbers">
          <DetailRow icon={iconPhone} label="Phone" value={s.phoneNo} onCopy={() => copy(s.phoneNo)} />
          <DetailRow icon={iconPhone} label="WhatsApp" value={s.whatsAppNo} onCopy={() => copy(s.whatsAppNo)} />
          <DetailRow icon={iconPhone} label="Alt Phone" value={s.altPhoneNo} onCopy={() => copy(s.altPhoneNo)} />
          <DetailRow icon={iconPhone} label="Alt WhatsApp" value={s.altWhatsAppNo} onCopy={() => copy(s.altWhatsAppNo)} />
        </Section>

        {(s.address || s.state || s.country || s.pinCode) && (
          <Section title="Address">
            <DetailRow icon={iconMap} label="Address" value={s.address} />
            <DetailRow icon={iconMap} label="State" value={s.state} />
            <DetailRow icon={iconMap} label="Country" value={s.country} />
            <DetailRow icon={iconMap} label="Pin Code" value={s.pinCode} />
          </Section>
        )}

        {(s.bankName || s.accountNo || s.upiId) && (
          <Section title="Primary Bank">
            <DetailRow icon={iconBank} label="Bank" value={s.bankName} />
            <DetailRow icon={iconBank} label="Account No" value={s.accountNo} onCopy={() => copy(s.accountNo)} />
            <DetailRow icon={iconBank} label="IFSC" value={s.ifscCode} onCopy={() => copy(s.ifscCode)} />
            <DetailRow icon={iconBank} label="Branch" value={s.branch} />
            <DetailRow icon={iconBank} label="Account Type" value={s.accountType} />
            <DetailRow icon={iconBank} label="UPI ID" value={s.upiId} onCopy={() => copy(s.upiId)} />
          </Section>
        )}

        {(s.altBankName || s.altAccountNo || s.altUpiId) && (
          <Section title="Alternate Bank">
            <DetailRow icon={iconBank} label="Bank" value={s.altBankName} />
            <DetailRow icon={iconBank} label="Account No" value={s.altAccountNo} onCopy={() => copy(s.altAccountNo)} />
            <DetailRow icon={iconBank} label="IFSC" value={s.altIfscCode} onCopy={() => copy(s.altIfscCode)} />
            <DetailRow icon={iconBank} label="Branch" value={s.altBranch} />
            <DetailRow icon={iconBank} label="Account Type" value={s.altAccountType} />
            <DetailRow icon={iconBank} label="UPI ID" value={s.altUpiId} onCopy={() => copy(s.altUpiId)} />
          </Section>
        )}
      </div>

      {/* Modal actions */}
      <div className={styles.actions}>
        {s.isArchived && (user?.role === "admin" || user?.role === "superadmin") ? (
          <Button leftIcon={<Icon name="restore-inventory" size={16} />} onClick={() => onRestore(s._id)}>
            Restore Seller
          </Button>
        ) : (
          !s.isArchived && (
            <>
              <Button variant="secondary" leftIcon={<Icon name="edit-inventory" size={16} />} onClick={onEdit}>
                Edit Seller
              </Button>
              <Button variant="danger" leftIcon={<Icon name="trash" size={16} />} onClick={() => onArchive(s._id)}>
                Archive Seller
              </Button>
            </>
          )
        )}
      </div>
    </Modal>
  );
}
