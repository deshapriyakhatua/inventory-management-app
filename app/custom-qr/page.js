"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import FormField from "@/components/ui/FormField/FormField";
import Icon from "@/components/ui/Icon/Icon";
import Input from "@/components/ui/Input/Input";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import Spinner from "@/components/ui/Spinner/Spinner";
import styles from "./page.module.css";

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
        backgroundColor: "#ffffff", // QR scan exception: export background stays white
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
        backgroundColor: "#ffffff", // QR scan exception: export background stays white
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
    <PageShell className={styles.shell}>
      <PageHeader
        title="Custom Payment QR Generator"
        subtitle="Generate custom amount UPI QR codes and download as high-res JPG or PNG images."
      />

      <div className={styles.layout}>
        {/* Left: Input Controls */}
        <Card padding="lg" className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <Icon name="payment-qr-balance" size={18} />
            <h2 className={styles.sectionTitle}>Payment Details</h2>
          </div>

          <div className={styles.fields}>
            {/* Amount Field */}
            <div className={styles.amountGroup}>
              <FormField label="Custom Amount (₹)">
                <Input
                  type="number"
                  step="any"
                  leading={<span className={styles.currencyPrefix}>₹</span>}
                  className={styles.amountInput}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 500)"
                  min="0"
                />
              </FormField>

              {/* Quick Preset Buttons */}
              <div className={styles.quickPills}>
                {PRESET_AMOUNTS.map((amt) => {
                  const isActive = String(amount) === String(amt);
                  return (
                    <Button
                      key={amt}
                      size="sm"
                      variant={isActive ? "primary" : "secondary"}
                      aria-pressed={isActive}
                      onClick={() => setAmount(String(amt))}
                    >
                      + ₹{amt}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className={styles.grid2}>
              {/* UPI ID Field */}
              <FormField label="Payee UPI ID / VPA">
                <Input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. 033311501063323@slice"
                />
              </FormField>

              {/* Payee Name Field */}
              <FormField label="Payee / Business Name">
                <Input
                  type="text"
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="e.g. CRAZYKUDI"
                />
              </FormField>
            </div>

            {/* Payment Note / Remarks */}
            <FormField label="Payment Note / Remarks">
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Custom Payment / Order #104"
              />
            </FormField>

            <Button
              variant="secondary"
              className={styles.fullWidth}
              onClick={handleCopyLink}
              leftIcon={<Icon name="copy-inventory-id" size={18} />}
            >
              Copy UPI Payment Link
            </Button>
          </div>
        </Card>

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
              <Image
                src={qrImageUrl}
                alt="Payment QR Code"
                width={300}
                height={300}
                unoptimized
                loading="eager"
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
            <Button
              size="lg"
              className={styles.fullWidth}
              onClick={handleDownloadJpg}
              disabled={isDownloadingJpg}
              leftIcon={isDownloadingJpg ? <Spinner size="sm" className={styles.buttonSpinner} /> : <Icon name="download-invoices-excel-report" size={18} />}
            >
              {isDownloadingJpg ? "Generating JPG..." : "Download QR Code (JPG)"}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className={styles.fullWidth}
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              leftIcon={isDownloadingPng ? <Spinner size="sm" className={styles.buttonSpinner} /> : <Icon name="download-invoices-excel-report" size={18} />}
            >
              {isDownloadingPng ? "Generating PNG..." : "Download QR Code (PNG)"}
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
