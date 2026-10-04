"use client";
import Icon from "@/components/ui/Icon/Icon";


import { useState, useEffect, useRef } from "react";
import styles from "./PaymentQrModal.module.css";
import { toast } from "sonner";

export default function PaymentQrModal({ isOpen, onClose, invoice }) {
  const [amount, setAmount] = useState("0");
  const [upiId, setUpiId] = useState("s6037472980259754@slc");
  const [payeeName, setPayeeName] = useState("CRAZYKUDI");
  const [note, setNote] = useState("");
  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);

  const qrCardRef = useRef(null);

  useEffect(() => {
    if (invoice) {
      const invBalance =
        invoice.balanceAmount !== undefined && invoice.balanceAmount !== null
          ? invoice.balanceAmount
          : (invoice.grandTotal || 0) - (invoice.receivedAmount || 0);

      setAmount(String(Math.max(0, invBalance)));
      if (invoice.sellerDetails?.upiId) {
        setUpiId(invoice.sellerDetails.upiId);
      }
      if (invoice.sellerDetails?.businessName) {
        setPayeeName(invoice.sellerDetails.businessName);
      }
      setNote(`CRAZYKUDI Invoice #${invoice.invoiceNumber || ""}`);
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount || 0}&tn=${encodeURIComponent(note || "Payment")}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    upiUri
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUri);
    toast.success("UPI payment link copied to clipboard!");
  };

  const handleDownloadJpg = async () => {
    if (!qrCardRef.current) return;
    setIsDownloadingJpg(true);
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

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `UPI_QR_${invoice.invoiceNumber || "Invoice"}_Balance_₹${amount}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Downloaded Payment QR Code as JPG!");
    } catch (err) {
      console.error("Error downloading JPG:", err);
      toast.error("Failed to download JPG image");
    } finally {
      setIsDownloadingJpg(false);
    }
  };

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
      link.download = `UPI_QR_${invoice.invoiceNumber || "Invoice"}_Balance_₹${amount}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Downloaded Payment QR Code as PNG!");
    } catch (err) {
      console.error("Error downloading PNG:", err);
      toast.error("Failed to download PNG image");
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const currentBalance =
    invoice.balanceAmount !== undefined && invoice.balanceAmount !== null
      ? invoice.balanceAmount
      : (invoice.grandTotal || 0) - (invoice.receivedAmount || 0);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>
              <Icon name="payment-qr-balance" size={22} />
              Payment QR Generator (Remaining Balance)
            </h2>
            <p className={styles.modalSubtitle}>
              Generate custom UPI payment QR code for outstanding balance.
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <Icon name="remove-this-product" />
          </button>
        </div>

        {/* Invoice Context Summary Banner */}
        <div className={styles.contextBanner}>
          <div className={styles.customerInfo}>
            <span className={styles.customerName}>
              {invoice.buyerDetails?.businessName || "N/A"}
            </span>
            <span className={styles.invoiceMeta}>
              Invoice #{invoice.invoiceNumber} • Status: {invoice.paymentStatus}
            </span>
          </div>
          <div className={styles.balancePill}>
            Balance Due: ₹{currentBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Form and Preview Grid */}
        <div className={styles.grid}>
          {/* Left: Inputs */}
          <div className={styles.formSection}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>QR Amount (₹)</label>
              <div className={styles.amountWrapper}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  type="number"
                  step="any"
                  className={`${styles.input} ${styles.amountInput}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Payee UPI ID</label>
              <input
                type="text"
                className={styles.input}
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Payee Business Name</label>
              <input
                type="text"
                className={styles.input}
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Payment Remark / Note</label>
              <input
                type="text"
                className={styles.input}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Right: Preview Card & Buttons */}
          <div className={styles.previewSection}>
            <div ref={qrCardRef} className={styles.qrCardToExport}>
              <div className={styles.qrCompanyTitle}>{payeeName || "CRAZYKUDI"}</div>
              <div className={styles.qrSubtitle}>SCAN & PAY REMAINING BALANCE</div>

              <div className={styles.amountBadge}>
                ₹
                {Number(amount || 0).toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </div>

              <div className={styles.qrFrame}>
                <img src={qrImageUrl} alt="Payment QR Code" className={styles.qrImg} />
              </div>

              <div className={styles.qrCardFooter}>
                Invoice #{invoice.invoiceNumber}
              </div>
            </div>

            <div className={styles.actionsRow}>
              <button type="button" className={styles.copyBtn} onClick={handleCopyLink}>
                <Icon name="copy-inventory-id" size={15} />
                Copy Link
              </button>

              <button
                type="button"
                className={styles.dlBtnJpg}
                onClick={handleDownloadJpg}
                disabled={isDownloadingJpg}
              >
                {isDownloadingJpg ? "..." : "JPG"}
              </button>

              <button
                type="button"
                className={styles.dlBtnPng}
                onClick={handleDownloadPng}
                disabled={isDownloadingPng}
              >
                {isDownloadingPng ? "..." : "PNG"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
