import InvoicePdfPreview from "@/components/InvoicePdfPreview/InvoicePdfPreview";
import Button from "@/components/ui/Button/Button";
import Checkbox from "@/components/ui/Checkbox/Checkbox";
import Modal from "@/components/ui/Modal/Modal";
import styles from "./PdfPreviewModal.module.css";

// PDF Preview Modal (Recent History).
// INVOICE DOCUMENT EXCEPTION (REDESIGN_PLAN 8.1): <InvoicePdfPreview ref={modalPdfRef} .../>
// is the node handed to downloadInvoicePdf (html2canvas/jsPDF) by page.js, which also
// creates modalPdfRef. The element, its props and the ref must not change; only the
// modal chrome around it is redesigned (same chrome as /all-invoices).
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
    <Modal
      open
      onClose={onClose}
      size="xl"
      ariaLabel={`Invoice #${pdfModalInvoice.invoiceNumber}`}
      className={styles.panel}
    >
      <div className={styles.root}>
        <div className={styles.toolbar}>
          <label className={styles.qrToggle}>
            <Checkbox checked={showQrCodePdfModal} onChange={onShowQrCodeChange} />
            <span>Show QR Code</span>
          </label>
          <Button onClick={onDownloadPdf} loading={isDownloadingPdfModal}>
            {isDownloadingPdfModal ? "Downloading..." : "Download PDF"}
          </Button>
        </div>

        {/* Reusable Exact Replica PDF Component */}
        <InvoicePdfPreview ref={modalPdfRef} invoice={pdfModalInvoice} showQrCode={showQrCodePdfModal} />
      </div>
    </Modal>
  );
}
