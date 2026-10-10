import InvoicePdfPreview from "@/components/InvoicePdfPreview/InvoicePdfPreview";
import Button from "@/components/ui/Button/Button";
import Checkbox from "@/components/ui/Checkbox/Checkbox";
import Modal from "@/components/ui/Modal/Modal";
import styles from "./PdfPreviewModal.module.css";

// VIEW PDF / PRINT MODAL.
// INVOICE DOCUMENT EXCEPTION (REDESIGN_PLAN 8.1): <InvoicePdfPreview ref={pdfPreviewRef} .../>
// is the node handed to downloadInvoicePdf (html2canvas/jsPDF) by page.js. The element, its props
// and the ref must not change; only the modal chrome around it is redesigned.
export default function PdfPreviewModal({
  open,
  viewingInvoice,
  pdfPreviewRef,
  showQrCode,
  onShowQrCodeChange,
  isDownloadingPdf,
  onDownloadPdf,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      ariaLabel={`Invoice #${viewingInvoice.invoiceNumber}`}
      className={styles.panel}
    >
      <div className={styles.root}>
        <div className={styles.toolbar}>
          <label className={styles.qrToggle}>
            <Checkbox checked={showQrCode} onChange={onShowQrCodeChange} />
            <span>Show QR Code</span>
          </label>
          <Button onClick={onDownloadPdf} loading={isDownloadingPdf}>
            {isDownloadingPdf ? "Downloading..." : "Download PDF"}
          </Button>
        </div>

        {/* Reusable Exact Replica PDF Component */}
        <InvoicePdfPreview ref={pdfPreviewRef} invoice={viewingInvoice} showQrCode={showQrCode} />
      </div>
    </Modal>
  );
}
