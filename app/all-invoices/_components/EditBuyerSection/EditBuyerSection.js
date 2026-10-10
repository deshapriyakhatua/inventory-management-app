import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import Select from "@/components/ui/Select/Select";
import { GST_STATES } from "@/utils/gstStates";
import EditFormSection from "../EditFormSection/EditFormSection";

// onBuyerFieldChange(field, value) merges into editingInvoice.buyerDetails (page.js).
export default function EditBuyerSection({ editingInvoice, onBuyerFieldChange }) {
  return (
    <EditFormSection title="Customer / Buyer Info">
      <FormField label="Customer Name">
        <Input
          type="text"
          value={editingInvoice.buyerDetails?.businessName || ""}
          onChange={(e) => onBuyerFieldChange("businessName", e.target.value)}
          required
        />
      </FormField>

      <FormField label="Contact No">
        <Input
          type="text"
          value={editingInvoice.buyerDetails?.phoneNo || ""}
          onChange={(e) => onBuyerFieldChange("phoneNo", e.target.value)}
          placeholder="e.g. +91 9876543210"
        />
      </FormField>

      <FormField label="GSTIN">
        <Input
          type="text"
          value={editingInvoice.buyerDetails?.gstNo || ""}
          onChange={(e) => onBuyerFieldChange("gstNo", e.target.value)}
        />
      </FormField>

      <FormField label="Address">
        <Input
          type="text"
          value={editingInvoice.buyerDetails?.address || ""}
          onChange={(e) => onBuyerFieldChange("address", e.target.value)}
        />
      </FormField>

      <FormField label="State">
        <Select
          value={editingInvoice.buyerDetails?.state || "19-West Bengal"}
          onChange={(e) => onBuyerFieldChange("state", e.target.value)}
        >
          {GST_STATES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </Select>
      </FormField>
    </EditFormSection>
  );
}
