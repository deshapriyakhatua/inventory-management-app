import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import FormField from "@/components/ui/FormField/FormField";
import Icon from "@/components/ui/Icon/Icon";
import Input from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal/Modal";
import Textarea from "@/components/ui/Textarea/Textarea";
import styles from "./EditSellerModal.module.css";

function Field({ label, name, type = "text", placeholder = "", value, onChange, disabled, required }) {
  return (
    <FormField label={label} required={required}>
      <Input
        id={name}
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder || label}
        disabled={disabled}
      />
    </FormField>
  );
}

function TextArea({ label, name, placeholder = "", value, onChange, disabled }) {
  return (
    <FormField label={label}>
      <Textarea
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder || label}
        disabled={disabled}
        rows={3}
      />
    </FormField>
  );
}

function Section({ icon, title, optional, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icon name={icon} size={18} />
        <h3 className={styles.sectionTitle}>{title}</h3>
        {optional && <Badge>Optional</Badge>}
      </div>
      {children}
    </section>
  );
}

export default function EditSellerModal({ editFormData, editLoading, onEditChange, onSubmit, onClose }) {
  const f = editFormData;
  const props = (name) => ({ name, value: f[name], onChange: onEditChange, disabled: editLoading });

  return (
    <Modal open onClose={onClose} size="lg" title="Edit Seller Details">
      {/* noValidate: the empty Business Name check stays a toast, as before */}
      <form onSubmit={onSubmit} className={styles.form} noValidate>
        <Section icon="icon-4c39cef6" title="Business Information">
          <div className={styles.grid2}>
            <Field label="Business Name" placeholder="e.g., ABC Traders" required {...props("businessName")} />
            <Field label="GST No" placeholder="e.g., 27ABCDE1234F1Z5" {...props("gstNo")} />
            <Field label="Contact Person" placeholder="e.g., Ramesh Kumar" {...props("contactPerson")} />
            <Field label="Email" type="email" placeholder="e.g., seller@example.com" {...props("email")} />
            <Field label="Shipping Provider" placeholder="e.g., Delhivery" {...props("shippingProvider")} />
          </div>
        </Section>

        <Section icon="icon-2d625620" title="Contact Numbers">
          <div className={styles.grid2}>
            <Field label="Phone No" placeholder="+91 98765 43210" {...props("phoneNo")} />
            <Field label="WhatsApp No" placeholder="+91 98765 43210" {...props("whatsAppNo")} />
            <Field label="Alt Phone No" placeholder="+91 98765 00000" {...props("altPhoneNo")} />
            <Field label="Alt WhatsApp No" placeholder="+91 98765 00000" {...props("altWhatsAppNo")} />
          </div>
        </Section>

        <Section icon="icon-28f62de3" title="Address">
          <TextArea label="Address" placeholder="Street, Area, City" {...props("address")} />
          <div className={styles.grid3}>
            <Field label="Country" placeholder="e.g., India" {...props("country")} />
            <Field label="State" placeholder="e.g., Maharashtra" {...props("state")} />
            <Field label="Pin Code" placeholder="e.g., 400001" {...props("pinCode")} />
          </div>
        </Section>

        <Section icon="icon-208b8f70" title="Primary Banking Details">
          <div className={styles.grid2}>
            <Field label="Bank Name" placeholder="e.g., HDFC Bank" {...props("bankName")} />
            <Field label="Account No" placeholder="e.g., 1234567890" {...props("accountNo")} />
            <Field label="IFSC Code" placeholder="e.g., HDFC0001234" {...props("ifscCode")} />
            <Field label="Branch" placeholder="e.g., Andheri West" {...props("branch")} />
            <Field label="Account Type" placeholder="e.g., Current, Savings" {...props("accountType")} />
            <Field label="UPI ID" placeholder="e.g., seller@upi" {...props("upiId")} />
          </div>
        </Section>

        <Section icon="icon-208b8f70" title="Alternate Banking Details" optional>
          <div className={styles.grid2}>
            <Field label="Alt Bank Name" placeholder="e.g., SBI" {...props("altBankName")} />
            <Field label="Alt Account No" placeholder="e.g., 00112233" {...props("altAccountNo")} />
            <Field label="Alt IFSC Code" placeholder="e.g., SBIN0001234" {...props("altIfscCode")} />
            <Field label="Alt Branch" placeholder="e.g., Bandra" {...props("altBranch")} />
            <Field label="Alt Account Type" placeholder="e.g., Current" {...props("altAccountType")} />
            <Field label="Alt UPI ID" placeholder="e.g., alt@upi" {...props("altUpiId")} />
          </div>
        </Section>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={editLoading}>Cancel</Button>
          <Button type="submit" loading={editLoading}>
            {editLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
