"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";


import React, { useState } from "react";
import styles from "./page.module.css";


const INITIAL_FORM = {
  businessName: "",
  gstNo: "",
  contactPerson: "",
  email: "",
  phoneNo: "",
  whatsAppNo: "",
  altPhoneNo: "",
  altWhatsAppNo: "",
  address: "",
  country: "",
  pinCode: "",
  state: "",
  shippingProvider: "",
  bankName: "",
  accountNo: "",
  ifscCode: "",
  branch: "",
  accountType: "",
  upiId: "",
  altBankName: "",
  altAccountNo: "",
  altIfscCode: "",
  altBranch: "",
  altAccountType: "",
  altUpiId: "",
};

/* ── Defined OUTSIDE the page component so React never remounts them ── */
function Field({ label, name, type = "text", placeholder = "", value, onChange, disabled }) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={name} className={styles.label}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        className={styles.input}
        disabled={disabled}
      />
    </div>
  );
}

function TextArea({ label, name, placeholder = "", value, onChange, disabled }) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={name} className={styles.label}>{label}</label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        className={styles.textarea}
        disabled={disabled}
        rows={3}
      />
    </div>
  );
}

export default function AddSellerPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss("app-feedback");

    if (!form.businessName.trim()) {
      toast.error("Business Name is required.", { id: "app-feedback", duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/employee/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Seller added successfully!", { id: "app-feedback", duration: 3000 });
        setForm(INITIAL_FORM);
      } else {
        toast.error(result.error || "Failed to add seller.", { id: "app-feedback", duration: 3000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderIcon}>
          <Icon name="icon-d5851a0c" size={28} />
        </div>
        <div>
          <h1 className={styles.pageTitle}>Add New Seller</h1>
          <p className={styles.pageSubtitle}>Fill in the seller&apos;s business, contact, and banking details.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* ── Section: Basic Info ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Icon name="icon-4c39cef6" size={18} />
            <h2 className={styles.sectionTitle}>Business Information</h2>
          </div>
          <div className={styles.grid2}>
            <Field label="Business Name *" name="businessName" placeholder="e.g., ABC Traders" value={form.businessName} onChange={handleChange} disabled={loading} />
            <Field label="GST No" name="gstNo" placeholder="e.g., 27ABCDE1234F1Z5" value={form.gstNo} onChange={handleChange} disabled={loading} />
            <Field label="Contact Person" name="contactPerson" placeholder="e.g., Ramesh Kumar" value={form.contactPerson} onChange={handleChange} disabled={loading} />
            <Field label="Email" name="email" type="email" placeholder="e.g., seller@example.com" value={form.email} onChange={handleChange} disabled={loading} />
            <Field label="Shipping Provider" name="shippingProvider" placeholder="e.g., Delhivery, BlueDart" value={form.shippingProvider} onChange={handleChange} disabled={loading} />
          </div>
        </div>

        {/* ── Section: Contact ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Icon name="icon-2d625620" size={18} />
            <h2 className={styles.sectionTitle}>Contact Numbers</h2>
          </div>
          <div className={styles.grid2}>
            <Field label="Phone No" name="phoneNo" placeholder="+91 98765 43210" value={form.phoneNo} onChange={handleChange} disabled={loading} />
            <Field label="WhatsApp No" name="whatsAppNo" placeholder="+91 98765 43210" value={form.whatsAppNo} onChange={handleChange} disabled={loading} />
            <Field label="Alt Phone No" name="altPhoneNo" placeholder="+91 98765 00000" value={form.altPhoneNo} onChange={handleChange} disabled={loading} />
            <Field label="Alt WhatsApp No" name="altWhatsAppNo" placeholder="+91 98765 00000" value={form.altWhatsAppNo} onChange={handleChange} disabled={loading} />
          </div>
        </div>

        {/* ── Section: Address ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Icon name="icon-28f62de3" size={18} />
            <h2 className={styles.sectionTitle}>Address</h2>
          </div>
          <div className={styles.grid1}>
            <TextArea label="Address" name="address" placeholder="Street, Area, City" value={form.address} onChange={handleChange} disabled={loading} />
          </div>
          <div className={styles.grid3}>
            <Field label="Country" name="country" placeholder="e.g., India" value={form.country} onChange={handleChange} disabled={loading} />
            <Field label="State" name="state" placeholder="e.g., Maharashtra" value={form.state} onChange={handleChange} disabled={loading} />
            <Field label="Pin Code" name="pinCode" placeholder="e.g., 400001" value={form.pinCode} onChange={handleChange} disabled={loading} />
          </div>
        </div>

        {/* ── Section: Primary Bank ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Icon name="icon-208b8f70" size={18} />
            <h2 className={styles.sectionTitle}>Primary Banking Details</h2>
          </div>
          <div className={styles.grid2}>
            <Field label="Bank Name" name="bankName" placeholder="e.g., HDFC Bank" value={form.bankName} onChange={handleChange} disabled={loading} />
            <Field label="Account No" name="accountNo" placeholder="e.g., 12345678901234" value={form.accountNo} onChange={handleChange} disabled={loading} />
            <Field label="IFSC Code" name="ifscCode" placeholder="e.g., HDFC0001234" value={form.ifscCode} onChange={handleChange} disabled={loading} />
            <Field label="Branch" name="branch" placeholder="e.g., Andheri West" value={form.branch} onChange={handleChange} disabled={loading} />
            <Field label="Account Type" name="accountType" placeholder="e.g., Current, Savings" value={form.accountType} onChange={handleChange} disabled={loading} />
            <Field label="UPI ID" name="upiId" placeholder="e.g., seller@upi" value={form.upiId} onChange={handleChange} disabled={loading} />
          </div>
        </div>

        {/* ── Section: Alternate Bank ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Icon name="icon-208b8f70" size={18} />
            <h2 className={styles.sectionTitle}>Alternate Banking Details</h2>
            <span className={styles.optionalBadge}>Optional</span>
          </div>
          <div className={styles.grid2}>
            <Field label="Alt Bank Name" name="altBankName" placeholder="e.g., SBI" value={form.altBankName} onChange={handleChange} disabled={loading} />
            <Field label="Alt Account No" name="altAccountNo" placeholder="e.g., 00112233445566" value={form.altAccountNo} onChange={handleChange} disabled={loading} />
            <Field label="Alt IFSC Code" name="altIfscCode" placeholder="e.g., SBIN0001234" value={form.altIfscCode} onChange={handleChange} disabled={loading} />
            <Field label="Alt Branch" name="altBranch" placeholder="e.g., Bandra" value={form.altBranch} onChange={handleChange} disabled={loading} />
            <Field label="Alt Account Type" name="altAccountType" placeholder="e.g., Current, Savings" value={form.altAccountType} onChange={handleChange} disabled={loading} />
            <Field label="Alt UPI ID" name="altUpiId" placeholder="e.g., alt@upi" value={form.altUpiId} onChange={handleChange} disabled={loading} />
          </div>
        </div>

        <div className={styles.formFooter}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => setForm(INITIAL_FORM)}
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <Icon name="refresh-loop" size={18} className={styles.spinner} />
                Adding Seller...
              </>
            ) : (
              <>
                <Icon name="icon-d5851a0c" size={18} />
                Add Seller
              </>
            )}
          </button>
        </div>
      </form>

      </div>
  );
}
