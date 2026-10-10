"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button, Icon, Modal } from "@/components/ui";
import styles from "./PaymentQrModal.module.css";

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
    payeeName,
  )}&am=${amount || 0}&tn=${encodeURIComponent(note || "Payment")}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    upiUri,
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
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Payment QR Generator"
      description="Generate custom UPI payment QR code for the remaining balance."
      size="lg"
      closeLabel="Close payment QR"
    >
      <div className={styles.contextBanner}>
        <div className={styles.customerInfo}>
          <span className={styles.customerName}>{invoice.buyerDetails?.businessName || "N/A"}</span>
          <span className={styles.invoiceMeta}>
            Invoice #{invoice.invoiceNumber} • Status: {invoice.paymentStatus}
          </span>
        </div>
        <div className={styles.balancePill}>
          Balance Due: ₹{currentBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </div>
      </div>

      <div className={styles.grid}>
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

        <div className={styles.previewSection}>
          <div ref={qrCardRef} className={styles.qrCardToExport}>
            <div className={styles.qrCompanyTitle}>{payeeName || "CRAZYKUDI"}</div>
            <div className={styles.qrSubtitle}>SCAN & PAY REMAINING BALANCE</div>

            <div className={styles.amountBadge}>
              ₹
              {Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </div>

            <div className={styles.qrFrame}>
              {/* Plain <img>: the QR card is captured for download; next/image's lazy loading could leave it blank. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImageUrl} alt="Payment QR Code" className={styles.qrImg} />
            </div>

            <div className={styles.qrCardFooter}>Invoice #{invoice.invoiceNumber}</div>
          </div>

          <div className={styles.actionsRow}>
            <Button type="button" variant="secondary" onClick={handleCopyLink} leftIcon={<Icon name="copy-inventory-id" size={15} />}>
              Copy Link
            </Button>

            <Button type="button" variant="primary" onClick={handleDownloadJpg} disabled={isDownloadingJpg}>
              {isDownloadingJpg ? "..." : "JPG"}
            </Button>

            <Button type="button" variant="ghost" onClick={handleDownloadPng} disabled={isDownloadingPng}>
              {isDownloadingPng ? "..." : "PNG"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
