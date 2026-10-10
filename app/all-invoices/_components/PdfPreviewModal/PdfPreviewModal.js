import InvoicePdfPreview from "@/components/InvoicePdfPreview/InvoicePdfPreview";
import styles from "./PdfPreviewModal.module.css";

// VIEW PDF / PRINT MODAL.
// INVOICE DOCUMENT EXCEPTION (REDESIGN_PLAN 8.1): <InvoicePdfPreview ref={pdfPreviewRef} .../>
// is the node handed to downloadInvoicePdf (html2canvas/jsPDF) by page.js. Its wrapper DOM,
// classes and the ref are moved here verbatim from page.js and must not change.
export default function PdfPreviewModal({
  viewingInvoice,
  pdfPreviewRef,
  showQrCode,
  onShowQrCodeChange,
  isDownloadingPdf,
  onDownloadPdf,
  onClose,
}) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ width: "880px", background: "#18181b", color: "#ffffff" }}>
        <div className={styles.pdfModalHeader} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#ffffff", fontSize: "13px", cursor: "pointer", marginRight: "12px", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={showQrCode}
              onChange={onShowQrCodeChange}
              style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#ec4899" }}
            />
            <span>Show QR Code</span>
          </label>
          <button
            type="button"
            className={styles.createBtn}
            style={{ padding: "8px 18px", background: "#10b981" }}
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
          >
            {isDownloadingPdf ? "Downloading..." : "Download PDF"}
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            style={{ color: "#ffffff", fontSize: "24px" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Reusable Exact Replica PDF Component */}
        <InvoicePdfPreview ref={pdfPreviewRef} invoice={viewingInvoice} showQrCode={showQrCode} />
      </div>
    </div>
  );
}
