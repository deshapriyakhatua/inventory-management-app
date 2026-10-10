import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import Select from "@/components/ui/Select/Select";
import { GST_STATES } from "@/utils/gstStates";
import FormCard from "../FormCard/FormCard";
import styles from "./PartyDetails.module.css";

// Card 2: Customer & Seller Summary
export default function PartyDetails({ sellerDetails, buyerDetails, onBuyerFieldChange }) {
  return (
    <FormCard
      icon="icon-a887788a"
      title="Issued To (Customer)"
      lead={
        <div className={styles.sellerBanner}>
          <span className={styles.sellerBannerLabel}>Seller:</span>{" "}
          <span className={styles.sellerBannerName}>{sellerDetails.businessName || "N/A"}</span>
          <span className={styles.sellerBannerGst}> • GSTIN: {sellerDetails.gstNo || "N/A"}</span>
        </div>
      }
    >
      <div className={styles.formGrid}>
        <FormField label="Customer Name">
          <Input
            type="text"
            value={buyerDetails.businessName}
            onChange={(e) => onBuyerFieldChange("businessName", e.target.value)}
            required
          />
        </FormField>
        <FormField label="Contact No">
          <Input
            type="text"
            value={buyerDetails.phoneNo || ""}
            onChange={(e) => onBuyerFieldChange("phoneNo", e.target.value)}
            placeholder="e.g. +91 9876543210"
          />
        </FormField>
        <FormField label="Full Address">
          <Input
            type="text"
            value={buyerDetails.address}
            onChange={(e) => onBuyerFieldChange("address", e.target.value)}
          />
        </FormField>
        <FormField label="GSTIN Number">
          <Input
            type="text"
            value={buyerDetails.gstNo}
            onChange={(e) => onBuyerFieldChange("gstNo", e.target.value)}
          />
        </FormField>
        <FormField label="State">
          <Select
            value={buyerDetails.state}
            onChange={(e) => onBuyerFieldChange("state", e.target.value)}
          >
            {GST_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
    </FormCard>
  );
}
