"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";


import React, { useState } from "react";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import Badge from "@/components/ui/Badge/Badge";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import Textarea from "@/components/ui/Textarea/Textarea";
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
function Field({ label, name, type = "text", placeholder = "", value, onChange, onBlur, disabled, required, error }) {
  return (
    <FormField label={label} required={required} error={error}>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder || label}
        disabled={disabled}
      />
    </FormField>
  );
}

function TextArea({ label, name, placeholder = "", value, onChange, disabled }) {
  return (
    <FormField label={label}>
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        disabled={disabled}
        rows={3}
      />
    </FormField>
  );
}

function Section({ icon, title, optional, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icon name={icon} size={18} />
        <h2 className={styles.sectionTitle}>{title}</h2>
        {optional && <Badge>Optional</Badge>}
      </div>
      {children}
    </section>
  );
}

export default function AddSellerPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const businessNameError = nameTouched && !form.businessName.trim() ? "Business Name is required." : undefined;


  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss("app-feedback");

    if (!form.businessName.trim()) {
      setNameTouched(true);
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
        setNameTouched(false);
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
    <PageShell className={styles.shell}>
      <PageHeader
        title="Add New Seller"
        subtitle="Fill in the seller's business, contact, and banking details."
      />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* ── Section: Basic Info ── */}
          <Section icon="icon-4c39cef6" title="Business Information">
            <div className={styles.grid2}>
              <Field label="Business Name" name="businessName" placeholder="e.g., ABC Traders" value={form.businessName} onChange={handleChange} onBlur={() => setNameTouched(true)} disabled={loading} required error={businessNameError} />
              <Field label="GST No" name="gstNo" placeholder="e.g., 27ABCDE1234F1Z5" value={form.gstNo} onChange={handleChange} disabled={loading} />
              <Field label="Contact Person" name="contactPerson" placeholder="e.g., Ramesh Kumar" value={form.contactPerson} onChange={handleChange} disabled={loading} />
              <Field label="Email" name="email" type="email" placeholder="e.g., seller@example.com" value={form.email} onChange={handleChange} disabled={loading} />
              <Field label="Shipping Provider" name="shippingProvider" placeholder="e.g., Delhivery, BlueDart" value={form.shippingProvider} onChange={handleChange} disabled={loading} />
            </div>
          </Section>

          {/* ── Section: Contact ── */}
          <Section icon="icon-2d625620" title="Contact Numbers">
            <div className={styles.grid2}>
              <Field label="Phone No" name="phoneNo" placeholder="+91 98765 43210" value={form.phoneNo} onChange={handleChange} disabled={loading} />
              <Field label="WhatsApp No" name="whatsAppNo" placeholder="+91 98765 43210" value={form.whatsAppNo} onChange={handleChange} disabled={loading} />
              <Field label="Alt Phone No" name="altPhoneNo" placeholder="+91 98765 00000" value={form.altPhoneNo} onChange={handleChange} disabled={loading} />
              <Field label="Alt WhatsApp No" name="altWhatsAppNo" placeholder="+91 98765 00000" value={form.altWhatsAppNo} onChange={handleChange} disabled={loading} />
            </div>
          </Section>

          {/* ── Section: Address ── */}
          <Section icon="icon-28f62de3" title="Address">
            <TextArea label="Address" name="address" placeholder="Street, Area, City" value={form.address} onChange={handleChange} disabled={loading} />
            <div className={styles.grid3}>
              <Field label="Country" name="country" placeholder="e.g., India" value={form.country} onChange={handleChange} disabled={loading} />
              <Field label="State" name="state" placeholder="e.g., Maharashtra" value={form.state} onChange={handleChange} disabled={loading} />
              <Field label="Pin Code" name="pinCode" placeholder="e.g., 400001" value={form.pinCode} onChange={handleChange} disabled={loading} />
            </div>
          </Section>

          {/* ── Section: Primary Bank ── */}
          <Section icon="icon-208b8f70" title="Primary Banking Details">
            <div className={styles.grid2}>
              <Field label="Bank Name" name="bankName" placeholder="e.g., HDFC Bank" value={form.bankName} onChange={handleChange} disabled={loading} />
              <Field label="Account No" name="accountNo" placeholder="e.g., 12345678901234" value={form.accountNo} onChange={handleChange} disabled={loading} />
              <Field label="IFSC Code" name="ifscCode" placeholder="e.g., HDFC0001234" value={form.ifscCode} onChange={handleChange} disabled={loading} />
              <Field label="Branch" name="branch" placeholder="e.g., Andheri West" value={form.branch} onChange={handleChange} disabled={loading} />
              <Field label="Account Type" name="accountType" placeholder="e.g., Current, Savings" value={form.accountType} onChange={handleChange} disabled={loading} />
              <Field label="UPI ID" name="upiId" placeholder="e.g., seller@upi" value={form.upiId} onChange={handleChange} disabled={loading} />
            </div>
          </Section>

          {/* ── Section: Alternate Bank ── */}
          <Section icon="icon-208b8f70" title="Alternate Banking Details" optional>
            <div className={styles.grid2}>
              <Field label="Alt Bank Name" name="altBankName" placeholder="e.g., SBI" value={form.altBankName} onChange={handleChange} disabled={loading} />
              <Field label="Alt Account No" name="altAccountNo" placeholder="e.g., 00112233445566" value={form.altAccountNo} onChange={handleChange} disabled={loading} />
              <Field label="Alt IFSC Code" name="altIfscCode" placeholder="e.g., SBIN0001234" value={form.altIfscCode} onChange={handleChange} disabled={loading} />
              <Field label="Alt Branch" name="altBranch" placeholder="e.g., Bandra" value={form.altBranch} onChange={handleChange} disabled={loading} />
              <Field label="Alt Account Type" name="altAccountType" placeholder="e.g., Current, Savings" value={form.altAccountType} onChange={handleChange} disabled={loading} />
              <Field label="Alt UPI ID" name="altUpiId" placeholder="e.g., alt@upi" value={form.altUpiId} onChange={handleChange} disabled={loading} />
            </div>
          </Section>

          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={() => { setForm(INITIAL_FORM); setNameTouched(false); }}
              disabled={loading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftIcon={<Icon name="icon-d5851a0c" size={18} />}
            >
              {loading ? "Adding Seller..." : "Add Seller"}
            </Button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
