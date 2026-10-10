import InvoicePdfPreview from "@/components/InvoicePdfPreview/InvoicePdfPreview";

// INVOICE DOCUMENT EXCEPTION (REDESIGN_PLAN 8.1): <InvoicePdfPreview ref={pdfPreviewRef} .../>
// is the node handed to downloadInvoicePdf (html2canvas/jsPDF) by page.js, which also
// creates pdfPreviewRef. The element, its props and the ref are moved here verbatim.
export default function PreviewPane({ pdfPreviewRef, invoiceDataForPdf }) {
  return (
    <InvoicePdfPreview ref={pdfPreviewRef} invoice={invoiceDataForPdf} />
  );
}
