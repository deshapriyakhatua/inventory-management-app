import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import Select from "@/components/ui/Select/Select";
import { GST_STATES } from "@/utils/gstStates";
import EditFormSection from "../EditFormSection/EditFormSection";

export default function EditHeaderSection({
  editingInvoice,
  modalAutoStatus,
  onInvoiceNumberChange,
  onInvoiceDateChange,
  onPlaceOfSupplyChange,
  onPaymentStatusChange,
}) {
  return (
    <EditFormSection title="Invoice Header">
      <FormField label="Invoice Number">
        <Input
          type="text"
          value={editingInvoice.invoiceNumber}
          onChange={onInvoiceNumberChange}
          required
        />
      </FormField>

      <FormField label="Invoice Date">
        <Input
          type="date"
          value={editingInvoice.invoiceDate || ""}
          onChange={onInvoiceDateChange}
          required
        />
      </FormField>

      <FormField label="Place of Supply">
        <Select
          value={editingInvoice.placeOfSupply || "19-West Bengal"}
          onChange={onPlaceOfSupplyChange}
        >
          {GST_STATES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Payment Status">
        <Select
          value={editingInvoice.paymentStatus || "Pending"}
          onChange={onPaymentStatusChange}
        >
          <option
            value="Pending"
            disabled={editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus !== "Pending"}
          >
            Pending {editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus === "Pending" ? "(Auto)" : ""}
          </option>
          <option
            value="Paid"
            disabled={editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus !== "Paid"}
          >
            Paid {editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus === "Paid" ? "(Auto)" : ""}
          </option>
          <option
            value="Partially Paid"
            disabled={editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus !== "Partially Paid"}
          >
            Partially Paid {editingInvoice.paymentStatus !== "Cancelled" && modalAutoStatus === "Partially Paid" ? "(Auto)" : ""}
          </option>
          <option value="Cancelled">Cancelled</option>
        </Select>
      </FormField>
    </EditFormSection>
  );
}
