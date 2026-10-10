import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import EditFormSection from "../EditFormSection/EditFormSection";
import styles from "./EditPaymentSection.module.css";

export default function EditPaymentSection({
  editingInvoice,
  onUpiIdChange,
  onShippingFeeChange,
  onDiscountChange,
  onReceivedAmountChange,
}) {
  return (
    <EditFormSection title="Payment & Totals">
      <FormField label="UPI Barcode / UPI ID">
        <Input
          type="text"
          value={editingInvoice.sellerDetails?.upiId || ""}
          onChange={onUpiIdChange}
          placeholder="e.g. 033311501063323@slice"
        />
      </FormField>

      <FormField label="Shipping Fee (₹)">
        <Input
          type="number"
          step="0.01"
          className={styles.numeric}
          value={editingInvoice.shippingFee || 0}
          onChange={onShippingFeeChange}
        />
      </FormField>

      <FormField label="Discount (₹)">
        <Input
          type="number"
          step="0.01"
          className={styles.numeric}
          value={editingInvoice.discount || 0}
          onChange={onDiscountChange}
        />
      </FormField>

      <FormField label="Received Amount (₹)">
        <Input
          type="number"
          step="0.01"
          className={styles.numeric}
          value={editingInvoice.receivedAmount || 0}
          onChange={onReceivedAmountChange}
        />
      </FormField>
    </EditFormSection>
  );
}
