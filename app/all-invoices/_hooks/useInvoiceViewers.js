"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

import { downloadInvoicePdf } from "@/utils/generatePdf";

// PDF preview/download, graphical view and payment QR modals.
export default function useInvoiceViewers() {
  // View / Print PDF Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const pdfPreviewRef = useRef(null);

  // Graphical View Modal State
  const [showGraphicalModal, setShowGraphicalModal] = useState(false);
  const [graphicalModalInvoice, setGraphicalModalInvoice] = useState(null);

  // Payment QR Modal State
  const [showPaymentQrModal, setShowPaymentQrModal] = useState(false);
  const [paymentQrInvoice, setPaymentQrInvoice] = useState(null);

  const handleOpenGraphicalModal = (inv) => {
    setGraphicalModalInvoice(inv);
    setShowGraphicalModal(true);
  };

  const handleOpenPaymentQr = (inv) => {
    setPaymentQrInvoice(inv);
    setShowPaymentQrModal(true);
  };

  // Open PDF View Modal
  const handleOpenPdf = (inv) => {
    setViewingInvoice(inv);
    setShowPdfModal(true);
  };

  // Download PDF Handler
  const handleDownloadPdf = async () => {
    if (!pdfPreviewRef.current || !viewingInvoice) return;
    setIsDownloadingPdf(true);
    try {
      const fileName = `Invoice_${viewingInvoice.invoiceNumber}_${(
        viewingInvoice.buyerDetails?.businessName || "B2B"
      ).replace(/\s+/g, "_")}.pdf`;
      await downloadInvoicePdf(pdfPreviewRef.current, fileName);
      toast.success("PDF generated and downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleClosePdfModal = () => setShowPdfModal(false);
  const handleShowQrCodeChange = (e) => setShowQrCode(e.target.checked);
  const handleCloseGraphicalModal = () => setShowGraphicalModal(false);

  return {
    showPdfModal,
    viewingInvoice,
    isDownloadingPdf,
    showQrCode,
    pdfPreviewRef,
    showGraphicalModal,
    graphicalModalInvoice,
    showPaymentQrModal,
    setShowPaymentQrModal,
    paymentQrInvoice,
    handleOpenGraphicalModal,
    handleOpenPaymentQr,
    handleOpenPdf,
    handleDownloadPdf,
    handleClosePdfModal,
    handleShowQrCodeChange,
    handleCloseGraphicalModal,
  };
}
