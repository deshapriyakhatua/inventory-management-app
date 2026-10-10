"use client";

import { useId } from "react";
import Button from "@/components/ui/Button/Button";
import FormField from "@/components/ui/FormField/FormField";
import Icon from "@/components/ui/Icon/Icon";
import Input from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal/Modal";
import Select from "@/components/ui/Select/Select";
import Textarea from "@/components/ui/Textarea/Textarea";
import { GST_STATES } from "@/utils/gstStates";
import styles from "./CompanySettingsModal.module.css";

function SettingsSection({ icon, title, titleId, children }) {
  return (
    <section className={styles.section}>
      <h3 id={titleId} className={styles.sectionTitle}>
        <Icon name={icon} size={18} />
        {title}
      </h3>
      {children}
    </section>
  );
}

// Company Details, Bank & Terms Modal
export default function CompanySettingsModal({
  sellerDetails,
  notes,
  isSavingCompany,
  onSellerFieldChange,
  onNotesChange,
  onSave,
  onClose,
}) {
  // The notes textarea has no visible label of its own; it is named by its section heading.
  const notesTitleId = useId();

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Company, Bank & Terms Settings"
      description="Pre-filled seller information, payment bank details, and invoice terms."
    >
      <div className={styles.root}>
        <SettingsSection icon="icon-d5851a0c" title="Company Details">
          <div className={styles.grid}>
            <FormField label="Company Name">
              <Input
                type="text"
                value={sellerDetails.businessName}
                onChange={(e) => onSellerFieldChange("businessName", e.target.value)}
              />
            </FormField>
            <FormField label="Address">
              <Input
                type="text"
                value={sellerDetails.address}
                onChange={(e) => onSellerFieldChange("address", e.target.value)}
              />
            </FormField>
            <FormField label="State">
              <Select
                value={sellerDetails.state || "19-West Bengal"}
                onChange={(e) => onSellerFieldChange("state", e.target.value)}
              >
                {GST_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="GSTIN">
              <Input
                type="text"
                value={sellerDetails.gstNo}
                onChange={(e) => onSellerFieldChange("gstNo", e.target.value)}
              />
            </FormField>
          </div>
        </SettingsSection>

        <SettingsSection icon="icon-3790acba" title="Bank & Payment Details">
          <div className={styles.grid}>
            <FormField label="Bank Name">
              <Input
                type="text"
                placeholder="e.g. Slice Small Finance Bank"
                value={sellerDetails.bankName}
                onChange={(e) => onSellerFieldChange("bankName", e.target.value)}
              />
            </FormField>
            <FormField label="Account Number">
              <Input
                type="text"
                placeholder="e.g. 033311501063323"
                value={sellerDetails.accountNo}
                onChange={(e) => onSellerFieldChange("accountNo", e.target.value)}
              />
            </FormField>
            <FormField label="IFSC Code">
              <Input
                type="text"
                placeholder="e.g. NESF0000333"
                value={sellerDetails.ifscCode}
                onChange={(e) => onSellerFieldChange("ifscCode", e.target.value)}
              />
            </FormField>
            <FormField label="UPI Barcode / UPI ID">
              <Input
                type="text"
                placeholder="e.g. 033311501063323@slice"
                value={sellerDetails.upiId || ""}
                onChange={(e) => onSellerFieldChange("upiId", e.target.value)}
              />
            </FormField>
          </div>
        </SettingsSection>

        <SettingsSection icon="view-and-download-invoice-pdf" title="Notes & Terms" titleId={notesTitleId}>
          <Textarea
            rows={4}
            value={notes}
            onChange={onNotesChange}
            placeholder="Terms & Conditions or notes..."
            aria-labelledby={notesTitleId}
          />
        </SettingsSection>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} loading={isSavingCompany}>
            {isSavingCompany ? "Saving..." : "Save & Done"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
