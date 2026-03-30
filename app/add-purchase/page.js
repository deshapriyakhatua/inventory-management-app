"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

export default function AddPurchasePage() {
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Data State
  const [sellers, setSellers] = useState([]);
  const [currentMappings, setCurrentMappings] = useState([]);
  
  // Form State
  const [formSellerId, setFormSellerId] = useState("");
  const [formSellerProductId, setFormSellerProductId] = useState("");
  const [formInventoryId, setFormInventoryId] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formShippingFee, setFormShippingFee] = useState("");
  const [formOrderedOn, setFormOrderedOn] = useState("");
  const [formReceivedOn, setFormReceivedOn] = useState("");
  const [formInvoiceNo, setFormInvoiceNo] = useState("");
  const [formTaxPercentage, setFormTaxPercentage] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMsg] = useState({ text: "", type: "" });

  const getTodayDateString = () => new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await fetch("/api/employee/purchase");
      const result = await res.json();
      if (res.ok && result.success) {
        setSellers(result.sellers || []);
        // Set default ordered on to today
        setFormOrderedOn(getTodayDateString());
      } else {
        setMsg({ text: result.error || "Failed to load active sellers", type: "error" });
      }
    } catch (error) {
      setMsg({ text: "Network error loading sellers", type: "error" });
    } finally {
      setLoadingInitial(false);
    }
  };

  // Watch Seller ID strictly to fetch smart mappings
  useEffect(() => {
    setFormSellerProductId("");
    setFormInventoryId("");
    setCurrentMappings([]);

    if (formSellerId) {
      fetchMappingsForSeller(formSellerId);
    }
  }, [formSellerId]);

  const fetchMappingsForSeller = async (sellerId) => {
    try {
      const res = await fetch(`/api/employee/purchase?sellerId=${sellerId}`);
      const result = await res.json();
      
      if (res.ok && result.success) {
        setCurrentMappings(result.mappings || []);
      }
    } catch (error) {
      console.error("Failed to fetch smart mappings", error);
    }
  };

  // Watch Seller Product ID strictly to Auto-select internal Inventory ID
  useEffect(() => {
    if (formSellerProductId && currentMappings.length > 0) {
      const matched = currentMappings.find(m => m.sellerProductId === formSellerProductId);
      if (matched) {
        setFormInventoryId(matched.inventoryId);
        setFormImageUrl(matched.imageUrl || "");
      } else {
        setFormInventoryId("");
        setFormImageUrl("");
      }
    } else {
      setFormInventoryId("");
      setFormImageUrl("");
    }
  }, [formSellerProductId, currentMappings]);

  const handleReset = () => {
    setFormSellerId("");
    setFormSellerProductId("");
    setFormInventoryId("");
    setFormImageUrl("");
    setFormQuantity("");
    setFormPrice("");
    setFormShippingFee("");
    setFormOrderedOn(getTodayDateString());
    setFormReceivedOn("");
    setFormInvoiceNo("");
    setFormTaxPercentage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formSellerId || !formSellerProductId || !formInventoryId || !formQuantity || !formPrice || !formOrderedOn) {
      setMsg({ text: "Please fill all required primary fields.", type: "error" });
      return;
    }

    setSubmitting(true);
    setMsg({ text: "", type: "" });

    try {
      const payload = {
        sellerId: formSellerId,
        sellerProductId: formSellerProductId,
        inventoryId: formInventoryId,
        quantity: Number(formQuantity),
        price: Number(formPrice),
        shippingFee: Number(formShippingFee) || 0,
        orderedOn: formOrderedOn,
        receivedOn: formReceivedOn || null,
        invoiceNo: formInvoiceNo || "",
        taxPercentage: Number(formTaxPercentage) || 0
      };

      const res = await fetch("/api/employee/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setMsg({ text: "Purchase logged successfully!", type: "success" });
        setTimeout(() => handleReset(), 500);
      } else {
        setMsg({ text: result.error || "Failed to log purchase", type: "error" });
      }
    } catch (error) {
      setMsg({ text: "Network Error. Please try again.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Loading purchase config...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Log Purchase</h1>
        <p className={styles.subtitle}>Record inbound stock invoices. This safely logs expenses without mutating open inventory limits.</p>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
            Purchase Definition
          </h2>

          <div className={styles.grid}>
            {/* Vendor Details */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Seller <span className={styles.required}>*</span></label>
              <select className={styles.select} value={formSellerId} onChange={e => setFormSellerId(e.target.value)} required>
                <option value="">-- Choose a Seller --</option>
                {sellers.map(s => (
                  <option key={s._id} value={s._id}>{s.businessName} {s.contactPerson ? `(${s.contactPerson})` : ""}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Seller Product ID / SKU <span className={styles.required}>*</span></label>
              <select className={styles.select} value={formSellerProductId} onChange={e => setFormSellerProductId(e.target.value)} required disabled={!formSellerId}>
                <option value="">-- Select Mapped SKU --</option>
                {currentMappings.map(m => (
                  <option key={m.sellerProductId} value={m.sellerProductId}>{m.sellerProductId}</option>
                ))}
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.full}`}>
              <label className={styles.label}>Internal Inventory ID (Auto-Selected)</label>
              <div className={styles.inventoryIdPreviewWrapper}>
                {formImageUrl && (
                  <img src={formImageUrl} alt="Item Preview" className={styles.inputImagePreview} />
                )}
                <input 
                  type="text" 
                  className={`${styles.input} ${styles.previewInput} ${formInventoryId ? styles.autoFilled : ""}`}
                  value={formInventoryId || "Awaiting Selection..."} 
                  readOnly 
                  disabled 
                />
              </div>
            </div>
          </div>

          <h2 className={`${styles.sectionTitle} mt-8`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Transaction Details
          </h2>

          <div className={styles.grid}>
            {/* Numbers */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Quantity <span className={styles.required}>*</span></label>
              <input type="number" min="1" className={styles.input} placeholder="e.g. 50" value={formQuantity} onChange={e => setFormQuantity(e.target.value)} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Unit Price <span className={styles.required}>*</span></label>
              <div className={styles.priceGroup}>
                <span className={styles.currencySymbol}>₹</span>
                <input type="number" min="0" step="0.01" className={`${styles.input} ${styles.priceInput}`} placeholder="0.00" value={formPrice} onChange={e => setFormPrice(e.target.value)} required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Shipping Fee</label>
              <div className={styles.priceGroup}>
                <span className={styles.currencySymbol}>₹</span>
                <input type="number" min="0" step="0.01" className={`${styles.input} ${styles.priceInput}`} placeholder="0.00" value={formShippingFee} onChange={e => setFormShippingFee(e.target.value)} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tax (%)</label>
              <input type="number" min="0" max="100" step="0.01" className={styles.input} placeholder="e.g. 18" value={formTaxPercentage} onChange={e => setFormTaxPercentage(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Invoice No</label>
              <input type="text" className={styles.input} placeholder="Optional Invoice ID" value={formInvoiceNo} onChange={e => setFormInvoiceNo(e.target.value)} />
            </div>
          </div>

          <h2 className={`${styles.sectionTitle} mt-8`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Timeline
          </h2>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ordered On <span className={styles.required}>*</span></label>
              <input type="date" className={styles.input} value={formOrderedOn} onChange={e => setFormOrderedOn(e.target.value)} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Received On</label>
              <input type="date" className={styles.input} value={formReceivedOn} onChange={e => setFormReceivedOn(e.target.value)} />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={submitting || !formInventoryId}>
            {submitting ? "Logging Purchase..." : "Save Purchase Log"}
          </button>
        </form>
      </div>

      <Toast message={message} onClose={() => setMsg({ text: "", type: "" })} />
    </div>
  );
}
