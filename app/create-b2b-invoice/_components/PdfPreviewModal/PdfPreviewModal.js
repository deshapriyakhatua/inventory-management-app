import InvoicePdfPreview from "@/components/InvoicePdfPreview/InvoicePdfPreview";
import styles from "./PdfPreviewModal.module.css";

// PDF Preview Modal (Recent History).
// INVOICE DOCUMENT EXCEPTION (REDESIGN_PLAN 8.1): <InvoicePdfPreview ref={modalPdfRef} .../>
// is the node handed to downloadInvoicePdf (html2canvas/jsPDF) by page.js, which also
// creates modalPdfRef. The element, its props and the ref are moved here verbatim.
export default function PdfPreviewModal({
  pdfModalInvoice,
  modalPdfRef,
  showQrCodePdfModal,
  isDownloadingPdfModal,
  onShowQrCodeChange,
  onDownloadPdf,
  onClose,
}) {
  return (
    <div className={styles.pdfModalOverlay} onClick={onClose}>
      <div
        className={styles.pdfModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#ffffff", fontSize: "13px", cursor: "pointer", marginRight: "12px", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={showQrCodePdfModal}
              onChange={onShowQrCodeChange}
              style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#ec4899" }}
            />
            <span>Show QR Code</span>
          </label>
          <button
            type="button"
            className={styles.downloadPdfBtn}
            style={{ padding: "8px 18px", background: "#10b981" }}
            onClick={onDownloadPdf}
            disabled={isDownloadingPdfModal}
          >
            {isDownloadingPdfModal ? "Downloading..." : "Download PDF"}
          </button>
          <button
            type="button"
            className={styles.pickerCloseBtn}
            style={{ color: "#ffffff", fontSize: "20px" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Reusable Exact Replica PDF Component */}
        <InvoicePdfPreview ref={modalPdfRef} invoice={pdfModalInvoice} showQrCode={showQrCodePdfModal} />
      </div>
    </div>
  );
}
