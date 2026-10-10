"use client";
import { useState, useRef } from "react";
import { toast } from "sonner";

import { downloadInvoicePdf } from "@/utils/generatePdf";

// Invoice submit, live preview PDF download (pdfPreviewRef) and print
export default function useInvoiceSubmit({
  invoiceNumber,
  invoiceDate,
  placeOfSupply,
  sellerDetails,
  buyerDetails,
  calculatedRows,
  subtotal,
  totalGst,
  shippingFee,
  discount,
  grandTotal,
  receivedAmount,
  balanceAmount,
  paymentStatus,
  notes,
  fetchRecentInvoices,
  fetchNextInvoiceId,
  setActiveTab,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const pdfPreviewRef = useRef(null);

  // Submit Invoice Form
  const handleSubmitInvoice = async (e) => {
    e.preventDefault();

    if (!invoiceNumber.trim()) {
      toast.error("Please provide or generate an Invoice Number");
      return;
    }
    if (!buyerDetails.businessName.trim()) {
      toast.error("Please enter Buyer Name");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        invoiceNumber,
        invoiceDate,
        placeOfSupply,
        sellerDetails,
        buyerDetails,
        lineItems: calculatedRows.map((row) => ({
          inventoryId: row.inventoryId,
          description: row.description,
          hsnCode: row.hsnCode,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          taxRate: row.gstRate,
          amount: row.subTotal,
          taxAmount: row.gstAmt,
          totalAmount: row.total,
        })),
        subtotal,
        totalTax: totalGst,
        shippingFee: Number(shippingFee) || 0,
        discount: Number(discount) || 0,
        grandTotal,
        receivedAmount: Number(receivedAmount) || 0,
        balanceAmount,
        paymentStatus,
        notes,
      };

      const res = await fetch("/api/employee/b2b-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("B2B Invoice created successfully!");
        fetchRecentInvoices();
        fetchNextInvoiceId();
        setActiveTab("preview");
      } else {
        toast.error(data.error || "Failed to save invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download PDF Handler
  const handleDownloadPdf = async () => {
    if (!pdfPreviewRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const fileName = `Invoice_${invoiceNumber || "Draft"}_${(
        buyerDetails.businessName || "B2B"
      ).replace(/\s+/g, "_")}.pdf`;
      await downloadInvoicePdf(pdfPreviewRef.current, fileName);
      toast.success("PDF generated and downloaded!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Native Print Handler
  const handlePrint = () => {
    window.print();
  };

  return {
    isSubmitting,
    isDownloadingPdf,
    pdfPreviewRef,
    handleSubmitInvoice,
    handleDownloadPdf,
    handlePrint,
  };
}
