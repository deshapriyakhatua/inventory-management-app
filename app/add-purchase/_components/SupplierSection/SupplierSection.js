import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import Select from "@/components/ui/Select/Select";
import FormSection from "../FormSection/FormSection";
import styles from "./SupplierSection.module.css";

export default function SupplierSection({
  sellers,
  sellerId,
  sellerError,
  onSellerChange,
  onSellerBlur,
  invoiceNo,
  onInvoiceNoChange,
}) {
  return (
    <FormSection icon="icon-2df76557" title="Supplier & Invoice">
      <div className={styles.root}>
        <FormField label="Seller" required error={sellerError}>
          <Select
            value={sellerId}
            onChange={e => onSellerChange(e.target.value)}
            onBlur={onSellerBlur}
          >
            <option value="">-- Choose a Seller --</option>
            {sellers.map(s => (
              <option key={s._id} value={s._id}>
                {s.businessName}{s.contactPerson ? ` (${s.contactPerson})` : ""}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Invoice No">
          <Input
            type="text"
            placeholder="Optional Invoice ID"
            value={invoiceNo}
            onChange={e => onInvoiceNoChange(e.target.value)}
          />
        </FormField>
      </div>
    </FormSection>
  );
}
