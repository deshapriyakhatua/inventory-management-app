"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { toast } from "sonner";
import { GST_STATES } from "@/utils/gstStates";
import RefreshIcon from "@/components/RefreshIcon/RefreshIcon";

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "CRAZYKUDI",
    address: "75/2 Ground Floor, B.T. Road, Kolkata - 90, West Bengal",
    state: "19-West Bengal",
    gstNo: "19JHWPK2955Q1ZW",
    bankName: "Slice Small Finance Bank",
    accountNo: "033311501063323",
    ifscCode: "NESF0000333",
    accountHolderName: "CRAZYKUDI",
    upiId: "s6037472980259754@slc",
    notes:
      "All goods checked before dispatch.\nGoods once sold will not taken back.\nOpening video is must for any claims. We are not responsible for any damages once goods leave our premises. Any dispute will be subject to Barrackpore jurisdiction only.",
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/company-settings");
      const data = await res.json();
      if (res.ok && data.data) {
        setFormData({
          businessName: data.data.businessName || "CRAZYKUDI",
          address: data.data.address || "",
          state: data.data.state || "19-West Bengal",
          gstNo: data.data.gstNo || "",
          bankName: data.data.bankName || "",
          accountNo: data.data.accountNo || "",
          ifscCode: data.data.ifscCode || "",
          accountHolderName: data.data.accountHolderName || "",
          upiId: data.data.upiId || "",
          notes: data.data.notes || "",
        });
      }
    } catch (err) {
      console.error("Failed to load company settings:", err);
      toast.error("Failed to load company settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.businessName.trim()) {
      toast.error("Company / Business Name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/employee/company-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Company & Bank settings saved successfully!");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Save company settings error:", err);
      toast.error("Network error while saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.titleIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div>
            <h1 className={styles.title}>Company & Bank Settings</h1>
            <p className={styles.subtitle}>
              Configure your permanent seller profile, bank account details, and invoice terms & conditions.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Link href="/create-b2b-invoice" className={styles.backBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Create B2B Invoice
          </Link>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchSettings}
            disabled={loading || saving}
            title="Reload settings from database"
          >
            <RefreshIcon isSpinning={loading} size={15} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className={styles.formWrapper}>
        {/* Card 1: Company Profile */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrap} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18"></path>
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
                <path d="M9 9h1"></path>
                <path d="M9 13h1"></path>
                <path d="M9 17h1"></path>
                <path d="M14 9h1"></path>
                <path d="M14 13h1"></path>
                <path d="M14 17h1"></path>
              </svg>
            </div>
            <div>
              <h2 className={styles.cardTitle}>Company Profile</h2>
              <span className={styles.cardSubtitle}>Appears as the Seller information on all generated B2B invoices</span>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={`${styles.inputGroup} ${styles.colFull}`}>
              <label className={styles.label}>Company / Business Name *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                placeholder="e.g. CRAZYKUDI"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>GSTIN Number</label>
              <input
                type="text"
                className={styles.input}
                value={formData.gstNo}
                onChange={(e) => handleChange("gstNo", e.target.value)}
                placeholder="e.g. 19JHWPK2955Q1ZW"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>State of Supply</label>
              <select
                className={styles.select}
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
              >
                {GST_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${styles.inputGroup} ${styles.colFull}`}>
              <label className={styles.label}>Registered Business Address</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter complete address..."
              />
            </div>
          </div>
        </div>

        {/* Card 2: Bank & Payment Details */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrap} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
            </div>
            <div>
              <h2 className={styles.cardTitle}>Bank & Payment Account</h2>
              <span className={styles.cardSubtitle}>Printed on invoice for direct NEFT/RTGS/UPI customer remittances</span>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Bank Name</label>
              <input
                type="text"
                className={styles.input}
                value={formData.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
                placeholder="e.g. Slice Small Finance Bank"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Account Holder Name</label>
              <input
                type="text"
                className={styles.input}
                value={formData.accountHolderName}
                onChange={(e) => handleChange("accountHolderName", e.target.value)}
                placeholder="e.g. CRAZYKUDI"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Account Number</label>
              <input
                type="text"
                className={styles.input}
                value={formData.accountNo}
                onChange={(e) => handleChange("accountNo", e.target.value)}
                placeholder="e.g. 033311501063323"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>IFSC Code</label>
              <input
                type="text"
                className={styles.input}
                value={formData.ifscCode}
                onChange={(e) => handleChange("ifscCode", e.target.value)}
                placeholder="e.g. NESF0000333"
              />
            </div>

            <div className={`${styles.inputGroup} ${styles.colFull}`}>
              <label className={styles.label}>UPI ID / VPA</label>
              <input
                type="text"
                className={styles.input}
                value={formData.upiId}
                onChange={(e) => handleChange("upiId", e.target.value)}
                placeholder="e.g. s6037472980259754@slc"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Default Terms & Conditions */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconWrap} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <div>
              <h2 className={styles.cardTitle}>Default Invoice Notes & Terms</h2>
              <span className={styles.cardSubtitle}>Default return policy, disclaimers, and legal jurisdiction printed at the bottom of invoices</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Terms & Conditions</label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Enter standard notes..."
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className={styles.saveBar}>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? (
              <>
                <div className={styles.spinner}></div>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>Save Company & Bank Info</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
