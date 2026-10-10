"use client";
import { useState, useRef } from "react";
import { toast } from "sonner";

import { downloadInvoicePdf } from "@/utils/generatePdf";

// Recent-history modals: PDF preview (modalPdfRef), graphical view and payment QR
export default function useHistoryModals() {
  // PDF Preview Modal state (Recent History)
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfModalInvoice, setPdfModalInvoice] = useState(null);
  const [showQrCodePdfModal, setShowQrCodePdfModal] = useState(false);
  const [isDownloadingPdfModal, setIsDownloadingPdfModal] = useState(false);
  const modalPdfRef = useRef(null);

  // Graphical View Modal state (Recent History)
  const [showGraphicalModal, setShowGraphicalModal] = useState(false);
  const [graphicalModalInvoice, setGraphicalModalInvoice] = useState(null);

  // Payment QR Modal State
  const [showPaymentQrModal, setShowPaymentQrModal] = useState(false);
  const [paymentQrInvoice, setPaymentQrInvoice] = useState(null);

  // Floating Cursor Image Preview state
  const [hoveredImage, setHoveredImage] = useState(null);

  const handleOpenPdfModal = (inv) => {
    setPdfModalInvoice(inv);
    setShowPdfModal(true);
  };

  const handleOpenPaymentQrModal = (inv) => {
    setPaymentQrInvoice(inv);
    setShowPaymentQrModal(true);
  };

  const handleModalDownloadPdf = async () => {
    if (!modalPdfRef.current || !pdfModalInvoice) return;
    setIsDownloadingPdfModal(true);
    try {
      const fileName = `Invoice_${pdfModalInvoice.invoiceNumber}_${(
        pdfModalInvoice.buyerDetails?.businessName || "B2B"
      ).replace(/\s+/g, "_")}.pdf`;
      await downloadInvoicePdf(modalPdfRef.current, fileName);
      toast.success("PDF generated and downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloadingPdfModal(false);
    }
  };

  const handleOpenGraphicalModal = (inv) => {
    setGraphicalModalInvoice(inv);
    setShowGraphicalModal(true);
  };

  const handleClosePdfModal = () => setShowPdfModal(false);
  const handleShowQrCodePdfModalChange = (e) => setShowQrCodePdfModal(e.target.checked);
  const handleCloseGraphicalModal = () => setShowGraphicalModal(false);

  return {
    showPdfModal,
    pdfModalInvoice,
    showQrCodePdfModal,
    isDownloadingPdfModal,
    modalPdfRef,
    showGraphicalModal,
    graphicalModalInvoice,
    showPaymentQrModal,
    setShowPaymentQrModal,
    paymentQrInvoice,
    handleOpenPdfModal,
    handleOpenPaymentQrModal,
    handleModalDownloadPdf,
    handleOpenGraphicalModal,
    handleClosePdfModal,
    handleShowQrCodePdfModalChange,
    handleCloseGraphicalModal,
  };
}
