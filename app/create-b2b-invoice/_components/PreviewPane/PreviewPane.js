import InvoicePdfPreview from "@/components/InvoicePdfPreview/InvoicePdfPreview";
import styles from "./PreviewPane.module.css";

// INVOICE DOCUMENT EXCEPTION (REDESIGN_PLAN 8.1): <InvoicePdfPreview ref={pdfPreviewRef} .../>
// is the node handed to downloadInvoicePdf (html2canvas/jsPDF) by page.js, which also
// creates pdfPreviewRef. The element, its props and the ref are moved here verbatim.
// The two wrappers only add horizontal scroll room; they set no colour, transform or filter.
export default function PreviewPane({ pdfPreviewRef, invoiceDataForPdf }) {
  return (
    <div className={styles.root}>
      <div className={styles.stage}>
        <InvoicePdfPreview ref={pdfPreviewRef} invoice={invoiceDataForPdf} />
      </div>
    </div>
  );
}
