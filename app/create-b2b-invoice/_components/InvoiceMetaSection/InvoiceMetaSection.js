import Button from "@/components/ui/Button/Button";
import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import Select from "@/components/ui/Select/Select";
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
    <FormCard icon="icon-f5ba4e77" title="Invoice Header Info">
      <div className={styles.formGrid}>
        <div className={styles.idRow}>
          <FormField label="Invoice No" className={styles.idField}>
            <Input
              type="text"
              value={invoiceNumber}
              onChange={onInvoiceNumberChange}
              placeholder="e.g. CZ-A9743"
              required
            />
          </FormField>
          <Button
            variant="secondary"
            onClick={onGenerateId}
            loading={isGeneratingId}
          >
            {isGeneratingId ? "..." : "Generate"}
          </Button>
        </div>

        <FormField label="Date">
          <Input
            type="date"
            value={invoiceDate}
            onChange={onInvoiceDateChange}
            required
          />
        </FormField>

        <FormField label="Place of Supply">
          <Select value={placeOfSupply} onChange={onPlaceOfSupplyChange}>
            {GST_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Payment Status">
          <Select value={paymentStatus} onChange={onPaymentStatusChange}>
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
          </Select>
        </FormField>
      </div>
    </FormCard>
  );
}
