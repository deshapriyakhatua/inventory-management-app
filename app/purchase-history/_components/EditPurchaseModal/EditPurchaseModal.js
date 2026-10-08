import Button from "@/components/ui/Button/Button";
import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal/Modal";
import styles from "./EditPurchaseModal.module.css";

export default function EditPurchaseModal({ editingData, isSaving, onChange, onCancel, onSave }) {
  return (
    <Modal
      open
      onClose={isSaving ? undefined : onCancel}
      closeOnScrim={!isSaving}
      size="md"
      title="Edit Purchase"
    >
      <div className={styles.root}>
        <div className={styles.grid}>
          <FormField label="Date Ordered" className={styles.full}>
            <Input type="date" name="orderedOn" value={editingData.orderedOn} onChange={onChange} required />
          </FormField>
          <FormField label="Quantity">
            <Input type="number" name="quantity" value={editingData.quantity} onChange={onChange} min="1" required />
          </FormField>
          <FormField label="Unit Price (₹)">
            <Input type="number" name="price" value={editingData.price} onChange={onChange} step="0.01" min="0" required />
          </FormField>
          <FormField label="Shipping Fee (₹)">
            <Input type="number" name="shippingFee" value={editingData.shippingFee} onChange={onChange} step="0.01" min="0" />
          </FormField>
          <FormField label="Tax (%)">
            <Input type="number" name="taxPercentage" value={editingData.taxPercentage} onChange={onChange} step="0.1" min="0" />
          </FormField>
          <FormField label="Invoice No" className={styles.full}>
            <Input type="text" name="invoiceNo" value={editingData.invoiceNo} onChange={onChange} placeholder="Enter Invoice No" />
          </FormField>
          <FormField label="Received On (Leave blank if In-Transit)" className={styles.full}>
            <Input type="date" name="receivedOn" value={editingData.receivedOn} onChange={onChange} />
          </FormField>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>Cancel</Button>
          <Button onClick={onSave} loading={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
