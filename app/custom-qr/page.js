"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { toast } from "sonner";

export default function CustomQrPage() {
  const [amount, setAmount] = useState("500");
  const [upiId, setUpiId] = useState("s6037472980259754@slc");
  const [payeeName, setPayeeName] = useState("CRAZYKUDI");
  const [note, setNote] = useState("Payment to CRAZYKUDI");
  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);

  const qrCardRef = useRef(null);

  const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const res = await fetch("/api/employee/company-settings");
      const data = await res.json();
      if (res.ok && data.data) {
        const cs = data.data;
        if (cs.upiId) setUpiId(cs.upiId);
        if (cs.accountHolderName || cs.businessName) {
          setPayeeName(cs.accountHolderName || cs.businessName);
        }
      }
    } catch (err) {
      console.error("Failed to fetch company settings for QR generator:", err);
    }
  };

  // Construct UPI Deep Link URL
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount || 0}&tn=${encodeURIComponent(note || "Payment")}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    upiUri
  )}`;

  // Download QR Code Card as JPG
  const handleDownloadJpg = async () => {
    if (!qrCardRef.current) return;
    setIsDownloadingJpg(true);
    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(qrCardRef.current, {
        scale: 3, // High quality render
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `UPI_QR_${amount ? amount + "_INR" : "Custom"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Downloaded QR Code as JPG image!");
    } catch (err) {
      console.error("Error downloading JPG:", err);
      toast.error("Failed to download JPG image");
    } finally {
      setIsDownloadingJpg(false);
    }
  };

  // Download QR Code Card as PNG
  const handleDownloadPng = async () => {
    if (!qrCardRef.current) return;
    setIsDownloadingPng(true);
    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(qrCardRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `UPI_QR_${amount ? amount + "_INR" : "Custom"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Downloaded QR Code as PNG image!");
    } catch (err) {
      console.error("Error downloading PNG:", err);
      toast.error("Failed to download PNG image");
    } finally {
      setIsDownloadingPng(false);
    }
  };

  // Copy UPI Deep Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUri);
    toast.success("UPI payment link copied to clipboard!");
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Custom Payment QR Generator</h1>
          <p className={styles.subtitle}>
            Generate custom amount UPI QR codes and download as high-res JPG or PNG images.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left: Input Controls */}
        <div className={styles.card}>
          <div className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Payment Details
          </div>

          <div className={styles.formGrid}>
            {/* Amount Field */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Custom Amount (₹)</label>
              <div className={styles.amountInputWrapper}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  type="number"
                  step="any"
                  className={`${styles.input} ${styles.amountInput}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 500)"
                  min="0"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className={styles.quickPills}>
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`${styles.pillBtn} ${
                      String(amount) === String(amt) ? styles.pillBtnActive : ""
                    }`}
                    onClick={() => setAmount(String(amt))}
                  >
                    + ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* UPI ID Field */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Payee UPI ID / VPA</label>
              <input
                type="text"
                className={styles.input}
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. 033311501063323@slice"
              />
            </div>

            {/* Payee Name Field */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Payee / Business Name</label>
              <input
                type="text"
                className={styles.input}
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. CRAZYKUDI"
              />
            </div>

            {/* Payment Note / Remarks */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Payment Note / Remarks</label>
              <input
                type="text"
                className={styles.input}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Custom Payment / Order #104"
              />
            </div>

            <div className={styles.actionBtnRow}>
              <button
                type="button"
                className={styles.copyLinkBtn}
                onClick={handleCopyLink}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy UPI Payment Link
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Preview & Download Card */}
        <div className={styles.previewWrapper}>
          {/* Exportable QR Card */}
          <div ref={qrCardRef} className={styles.qrCardToExport}>
            <div className={styles.qrCardHeader}>
              <div className={styles.qrCompanyTitle}>{payeeName || "CRAZYKUDI"}</div>
              <div className={styles.qrSubtitle}>SCAN & PAY WITH ANY UPI APP</div>
            </div>

            {/* Amount Badge */}
            <div className={styles.amountBadge}>
              ₹
              {Number(amount || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </div>

            {/* QR Image */}
            <div className={styles.qrFrame}>
              <img
                src={qrImageUrl}
                alt="Payment QR Code"
                className={styles.qrImage}
                crossOrigin="anonymous"
              />
            </div>

            {/* Details Footer */}
            <div className={styles.upiDetails}>
              <div>
                UPI ID: <span className={styles.upiIdTag}>{upiId}</span>
              </div>
              {note && <div className={styles.paymentNoteText}>Note: {note}</div>}
              <div className={styles.footerLogoText}>Powered by slice UPI / BHIM UPI</div>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className={styles.downloadGroup}>
            <button
              type="button"
              className={styles.downloadJpgBtn}
              onClick={handleDownloadJpg}
              disabled={isDownloadingJpg}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {isDownloadingJpg ? "Generating JPG..." : "Download QR Code (JPG)"}
            </button>

            <button
              type="button"
              className={styles.downloadPngBtn}
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {isDownloadingPng ? "Generating PNG..." : "Download QR Code (PNG)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
