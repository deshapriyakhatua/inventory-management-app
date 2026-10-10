import Icon from "@/components/ui/Icon/Icon";
import { GST_STATES } from "@/utils/gstStates";
import FormCard from "../FormCard/FormCard";
import styles from "./PartyDetails.module.css";

// Card 2: Customer & Seller Summary
export default function PartyDetails({ sellerDetails, buyerDetails, onBuyerFieldChange }) {
  return (
    <FormCard>
      <div className={styles.sellerSummaryBanner}>
        <div>
          <span className={styles.sellerBannerLabel}>Seller:</span>{" "}
          <span className={styles.sellerBannerName}>{sellerDetails.businessName || "N/A"}</span>
          <span className={styles.sellerBannerGst}> • GSTIN: {sellerDetails.gstNo || "N/A"}</span>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>
        <Icon name="icon-a887788a" />
        Issued To (Customer)
      </h3>
      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Customer Name *</label>
          <input
            type="text"
            className={styles.input}
            value={buyerDetails.businessName}
            onChange={(e) => onBuyerFieldChange("businessName", e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Contact No</label>
          <input
            type="text"
            className={styles.input}
            value={buyerDetails.phoneNo || ""}
            onChange={(e) => onBuyerFieldChange("phoneNo", e.target.value)}
            placeholder="e.g. +91 9876543210"
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Full Address</label>
          <input
            type="text"
            className={styles.input}
            value={buyerDetails.address}
            onChange={(e) => onBuyerFieldChange("address", e.target.value)}
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>GSTIN Number</label>
          <input
            type="text"
            className={styles.input}
            value={buyerDetails.gstNo}
            onChange={(e) => onBuyerFieldChange("gstNo", e.target.value)}
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>State</label>
          <select
            className={styles.select}
            value={buyerDetails.state}
            onChange={(e) => onBuyerFieldChange("state", e.target.value)}
          >
            {GST_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>
    </FormCard>
  );
}
