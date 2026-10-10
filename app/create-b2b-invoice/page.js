"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { toast } from "sonner";

import { downloadInvoicePdf } from "@/utils/generatePdf";
import { calculatePaymentStatus } from "@/lib/paymentStatus";
import PaymentQrModal from "@/components/PaymentQrModal/PaymentQrModal";

import CompanySettingsModal from "./_components/CompanySettingsModal/CompanySettingsModal";
import CursorImageTooltip from "./_components/CursorImageTooltip/CursorImageTooltip";
import GraphicalViewModal from "./_components/GraphicalViewModal/GraphicalViewModal";
import InventoryPickerModal from "./_components/InventoryPickerModal/InventoryPickerModal";
import InvoiceMetaSection from "./_components/InvoiceMetaSection/InvoiceMetaSection";
import InvoicePageHeader from "./_components/InvoicePageHeader/InvoicePageHeader";
import LineItemsTable from "./_components/LineItemsTable/LineItemsTable";
import MultiSelectInventoryModal from "./_components/MultiSelectInventoryModal/MultiSelectInventoryModal";
import PartyDetails from "./_components/PartyDetails/PartyDetails";
import PaymentSection from "./_components/PaymentSection/PaymentSection";
import PdfPreviewModal from "./_components/PdfPreviewModal/PdfPreviewModal";
import PreviewPane from "./_components/PreviewPane/PreviewPane";
import RecentInvoicesSection from "./_components/RecentInvoicesSection/RecentInvoicesSection";
import TaxSummary from "./_components/TaxSummary/TaxSummary";

export default function CreateB2BInvoicePage() {
  const [activeTab, setActiveTab] = useState("form"); // "form" | "preview"
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [inventoryList, setInventoryList] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState("");

  const pdfPreviewRef = useRef(null);
  const pickerSearchRef = useRef(null);

  // Inventory Modal state
  const [inventoryPickerIndex, setInventoryPickerIndex] = useState(null);
  const [inventorySearch, setInventorySearch] = useState("");
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

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

  // Multi-Select Inventory Modal state
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);
  const [selectedInvIds, setSelectedInvIds] = useState([]);
  const [multiSelectSearch, setMultiSelectSearch] = useState("");
  const multiSearchRef = useRef(null);

  const openMultiSelectModal = () => {
    setIsMultiSelectOpen(true);
    // Pre-populate selectedInvIds with all items currently present in lineItems
    const existingIds = lineItems
      .map((item) => item.inventoryId)
      .filter((id) => Boolean(id) && String(id).trim() !== "");
    setSelectedInvIds(Array.from(new Set(existingIds)));
    setMultiSelectSearch("");
    setTimeout(() => {
      if (multiSearchRef.current) {
        multiSearchRef.current.focus();
      }
    }, 50);
  };

  const closeMultiSelectModal = () => {
    setIsMultiSelectOpen(false);
    setSelectedInvIds([]);
    setMultiSelectSearch("");
  };

  const toggleInvSelection = (invId) => {
    setSelectedInvIds((prev) =>
      prev.includes(invId) ? prev.filter((id) => id !== invId) : [...prev, invId]
    );
  };

  const handleSelectAllFiltered = (filteredList) => {
    const ids = filteredList.map((i) => i.inventoryId);
    setSelectedInvIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelection = () => {
    setSelectedInvIds([]);
  };

  const handleAddSelectedItems = () => {
    // Map of currently existing items keyed by inventoryId to preserve their details (qty, price, gstRate, etc.)
    const existingMap = new Map();
    lineItems.forEach((item) => {
      if (item.inventoryId) {
        existingMap.set(item.inventoryId, item);
      }
    });

    // Custom manual rows without an inventoryId (e.g. user typed a description manually)
    const customRows = lineItems.filter(
      (item) => !item.inventoryId && (item.description || item.unitPrice > 0)
    );

    // Build list of inventory item rows based on selectedInvIds
    const updatedInvRows = selectedInvIds.map((invId) => {
      if (existingMap.has(invId)) {
        return existingMap.get(invId); // preserve existing quantities, prices, etc.
      }
      return {
        inventoryId: invId,
        description: invId,
        hsnCode: "7117",
        quantity: 1,
        unitPrice: 0,
        gstRate: 3,
      };
    });

    const finalRows = [...updatedInvRows, ...customRows];

    if (finalRows.length === 0) {
      finalRows.push({
        inventoryId: "",
        description: "",
        hsnCode: "7117",
        quantity: 1,
        unitPrice: 0,
        gstRate: 3,
      });
    }

    setLineItems(finalRows);
    toast.success(`Updated invoice with ${selectedInvIds.length} selected item(s)`);
    closeMultiSelectModal();
  };

  const handleAddBlankRow = () => {
    addLineItem();
    closeMultiSelectModal();
  };

  const filteredMultiInventory = inventoryList.filter((inv) => {
    if (!multiSelectSearch.trim()) return true;
    const q = multiSelectSearch.toLowerCase().trim();
    return (
      inv.inventoryId?.toLowerCase().includes(q) ||
      inv.vertical?.toLowerCase().includes(q)
    );
  });

  const openInventoryPicker = (index) => {
    setInventoryPickerIndex(index);
    setInventorySearch("");
    setTimeout(() => {
      if (pickerSearchRef.current) {
        pickerSearchRef.current.focus();
      }
    }, 50);
  };

  const closeInventoryPicker = () => {
    setInventoryPickerIndex(null);
    setInventorySearch("");
  };

  const selectInventoryItem = (inv) => {
    if (inventoryPickerIndex === null) return;
    handleLineItemChange(inventoryPickerIndex, "inventoryId", inv.inventoryId);
    closeInventoryPicker();
  };

  const filteredInventory = inventoryList.filter((inv) => {
    if (!inventorySearch.trim()) return true;
    const q = inventorySearch.toLowerCase().trim();
    return (
      inv.inventoryId?.toLowerCase().includes(q) ||
      inv.vertical?.toLowerCase().includes(q)
    );
  });

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0] // YYYY-MM-DD format for HTML <input type="date">
  );
  const [placeOfSupply, setPlaceOfSupply] = useState("19-West Bengal");
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  // Seller Details (Pre-filled matching sample invoice)
  const [sellerDetails, setSellerDetails] = useState({
    businessName: "CRAZYKUDI",
    address: "75/2 Ground Floor, B.T. Road, Kolkata - 90, West Bengal",
    state: "19-West Bengal",
    gstNo: "19JHWPK2955Q1ZW",
    bankName: "Slice Small Finance Bank",
    accountNo: "033311501063323",
    ifscCode: "NESF0000333",
    accountHolderName: "CRAZYKUDI",
    upiId: "s6037472980259754@slc",
  });

  // Buyer Details
  const [buyerDetails, setBuyerDetails] = useState({
    businessName: "",
    phoneNo: "",
    address:
      "",
    gstNo: "NA",
    state: "",
  });

  // Line Items
  const [lineItems, setLineItems] = useState([
    {
      inventoryId: "",
      description: "",
      hsnCode: "7117",
      quantity: 0,
      unitPrice: 0,
      gstRate: 3,
    },
  ]);

  // Overall Financials
  const [shippingFee, setShippingFee] = useState(150);
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [showQrCode, setShowQrCode] = useState(false);
  const [notes, setNotes] = useState(
    "All goods checked before dispatch.\nGoods once sold will not taken back.\nOpening video is must for any claims. We are not responsible for any damages once goods leave our premises. Any dispute will be subject to Barrackpore jurisdiction only."
  );

  useEffect(() => {
    fetchNextInvoiceId();
    fetchInventoryList();
    fetchRecentInvoices();
    fetchCompanySettings();
  }, []);

  // Fetch Saved Company & Bank Settings from Database
  const fetchCompanySettings = async () => {
    try {
      const res = await fetch("/api/employee/company-settings");
      const data = await res.json();
      if (res.ok && data.data) {
        const cs = data.data;
        setSellerDetails((prev) => ({
          ...prev,
          businessName: cs.businessName || prev.businessName,
          address: cs.address || prev.address,
          state: cs.state || prev.state,
          gstNo: cs.gstNo || prev.gstNo,
          bankName: cs.bankName || prev.bankName,
          accountNo: cs.accountNo || prev.accountNo,
          ifscCode: cs.ifscCode || prev.ifscCode,
          accountHolderName: cs.accountHolderName || prev.accountHolderName,
          upiId: cs.upiId || prev.upiId,
        }));
        if (cs.notes) {
          setNotes(cs.notes);
        }
      }
    } catch (err) {
      console.error("Failed to fetch company settings:", err);
    }
  };

  // Save Company & Bank Settings to Database
  const handleSaveCompanySettings = async () => {
    setIsSavingCompany(true);
    try {
      const res = await fetch("/api/employee/company-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sellerDetails,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Company & bank info saved to database!");
        setIsCompanyModalOpen(false);
      } else {
        toast.error(data.error || "Failed to save company settings");
      }
    } catch (err) {
      console.error("Save company settings error:", err);
      toast.error("Network error while saving company settings");
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Fetch Next Invoice ID (CZ-A0001 pattern)
  const fetchNextInvoiceId = async () => {
    setIsGeneratingId(true);
    try {
      const res = await fetch("/api/employee/b2b-invoice/generate-id");
      const data = await res.json();
      if (res.ok && data.nextId) {
        setInvoiceNumber(data.nextId);
      } else {
        toast.error("Failed to generate Invoice ID");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while generating ID");
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Fetch Inventory items for dropdown
  const fetchInventoryList = async () => {
    try {
      const res = await fetch("/api/employee/inventory");
      const data = await res.json();
      if (res.ok && data.data) {
        setInventoryList(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory list:", err);
    }
  };

  // Fetch Recent Invoices
  const fetchRecentInvoices = async () => {
    setIsLoadingHistory(true);
    try {
      const url = searchHistory
        ? `/api/employee/b2b-invoice?search=${encodeURIComponent(searchHistory)}`
        : `/api/employee/b2b-invoice`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.data) {
        setRecentInvoices(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch recent invoices:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Line Item Change Handlers
  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;

    if (field === "inventoryId" && value) {
      const selectedItem = inventoryList.find((i) => i.inventoryId === value);
      if (selectedItem) {
        updated[index].description = selectedItem.inventoryId;
      }
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        inventoryId: "",
        description: "",
        hsnCode: "7117",
        quantity: 1,
        unitPrice: 0,
        gstRate: 3,
      },
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) {
      toast.error("Invoice must have at least one item");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Detailed Row & Summary Calculations
  const calculatedRows = lineItems.map((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const rate = Number(item.gstRate !== undefined ? item.gstRate : item.taxRate) || 0;

    const subTotal = qty * price;
    const gstAmt = (subTotal * rate) / 100;
    const total = subTotal + gstAmt;

    return {
      ...item,
      subTotal,
      gstAmt,
      total,
    };
  });

  const subtotal = calculatedRows.reduce((sum, item) => sum + item.subTotal, 0);
  const totalGst = calculatedRows.reduce((sum, item) => sum + item.gstAmt, 0);
  const grandTotal =
    subtotal + totalGst + Number(shippingFee || 0) - Number(discount || 0);
  const balanceAmount = grandTotal - Number(receivedAmount || 0);
  const autoPaymentStatus = calculatePaymentStatus(grandTotal, receivedAmount);

  // Synchronize payment status with balance changes automatically (unless manually Cancelled)
  useEffect(() => {
    if (paymentStatus !== "Cancelled") {
      const autoSt = calculatePaymentStatus(grandTotal, receivedAmount);
      if (paymentStatus !== autoSt) {
        setPaymentStatus(autoSt);
      }
    }
  }, [grandTotal, receivedAmount, paymentStatus]);

  // Payload for PDF Component
  const invoiceDataForPdf = {
    invoiceNumber,
    invoiceDate,
    placeOfSupply,
    sellerDetails,
    buyerDetails,
    lineItems: calculatedRows.map((r) => ({
      ...r,
      taxRate: r.gstRate,
      amount: r.subTotal,
      taxAmount: r.gstAmt,
      totalAmount: r.total,
    })),
    subtotal,
    totalTax: totalGst,
    shippingFee,
    discount,
    grandTotal,
    receivedAmount,
    balanceAmount,
    notes,
    showQrCode,
  };

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

  // Inline JSX handlers moved out of the markup (bodies unchanged)
  const handleOpenCompanyModal = () => setIsCompanyModalOpen(true);
  const handleCloseCompanyModal = () => setIsCompanyModalOpen(false);
  const handleShowFormTab = () => setActiveTab("form");
  const handleShowPreviewTab = () => setActiveTab("preview");
  const handleShowQrCodeChange = (e) => setShowQrCode(e.target.checked);
  const handleInvoiceNumberChange = (e) => setInvoiceNumber(e.target.value.toUpperCase());
  const handleInvoiceDateChange = (e) => setInvoiceDate(e.target.value);
  const handlePlaceOfSupplyChange = (e) => {
    const selectedState = e.target.value;
    setPlaceOfSupply(selectedState);
    setBuyerDetails((prev) => ({
      ...prev,
      state: selectedState,
    }));
  };
  const handlePaymentStatusChange = (e) => {
    const val = e.target.value;
    if (val === "Cancelled") {
      setPaymentStatus("Cancelled");
    } else {
      setPaymentStatus(calculatePaymentStatus(grandTotal, receivedAmount));
    }
  };
  const handleBuyerFieldChange = (field, value) =>
    setBuyerDetails({ ...buyerDetails, [field]: value });
  const handleSellerFieldChange = (field, value) =>
    setSellerDetails({ ...sellerDetails, [field]: value });
  const handlePickerMouseEnter = (e, selectedInv) => {
    if (selectedInv?.imageUrl) {
      setHoveredImage({
        url: selectedInv.imageUrl,
        id: selectedInv.inventoryId,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };
  const handlePickerMouseMove = (e, selectedInv) => {
    if (selectedInv?.imageUrl) {
      setHoveredImage((prev) =>
        prev
          ? { ...prev, x: e.clientX, y: e.clientY }
          : {
              url: selectedInv.imageUrl,
              id: selectedInv.inventoryId,
              x: e.clientX,
              y: e.clientY,
            }
      );
    }
  };
  const handlePickerMouseLeave = () => setHoveredImage(null);
  const handleShippingFeeChange = (e) => setShippingFee(e.target.value);
  const handleDiscountChange = (e) => setDiscount(e.target.value);
  const handleReceivedAmountChange = (e) => setReceivedAmount(e.target.value);
  const handleInventorySearchChange = (e) => setInventorySearch(e.target.value);
  const handleClearInventorySearch = () => setInventorySearch("");
  const handleMultiSelectSearchChange = (e) => setMultiSelectSearch(e.target.value);
  const handleClearMultiSelectSearch = () => setMultiSelectSearch("");
  const handleNotesChange = (e) => setNotes(e.target.value);
  const handleClosePdfModal = () => setShowPdfModal(false);
  const handleShowQrCodePdfModalChange = (e) => setShowQrCodePdfModal(e.target.checked);
  const handleCloseGraphicalModal = () => setShowGraphicalModal(false);

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <InvoicePageHeader
        activeTab={activeTab}
        showQrCode={showQrCode}
        isDownloadingPdf={isDownloadingPdf}
        onOpenCompanyModal={handleOpenCompanyModal}
        onShowForm={handleShowFormTab}
        onShowPreview={handleShowPreviewTab}
        onShowQrCodeChange={handleShowQrCodeChange}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* Main Content */}
      {activeTab === "form" ? (
        <form onSubmit={handleSubmitInvoice}>
          <InvoiceMetaSection
            invoiceNumber={invoiceNumber}
            invoiceDate={invoiceDate}
            placeOfSupply={placeOfSupply}
            paymentStatus={paymentStatus}
            autoPaymentStatus={autoPaymentStatus}
            isGeneratingId={isGeneratingId}
            onInvoiceNumberChange={handleInvoiceNumberChange}
            onGenerateId={fetchNextInvoiceId}
            onInvoiceDateChange={handleInvoiceDateChange}
            onPlaceOfSupplyChange={handlePlaceOfSupplyChange}
            onPaymentStatusChange={handlePaymentStatusChange}
          />

          <PartyDetails
            sellerDetails={sellerDetails}
            buyerDetails={buyerDetails}
            onBuyerFieldChange={handleBuyerFieldChange}
          />

          <LineItemsTable
            calculatedRows={calculatedRows}
            inventoryList={inventoryList}
            onOpenInventoryPicker={openInventoryPicker}
            onPickerMouseEnter={handlePickerMouseEnter}
            onPickerMouseMove={handlePickerMouseMove}
            onPickerMouseLeave={handlePickerMouseLeave}
            onLineItemChange={handleLineItemChange}
            onRemoveLineItem={removeLineItem}
            onAddItemRow={openMultiSelectModal}
          />

          <TaxSummary
            subtotal={subtotal}
            totalGst={totalGst}
            shippingFee={shippingFee}
            discount={discount}
            grandTotal={grandTotal}
            isSubmitting={isSubmitting}
            onShippingFeeChange={handleShippingFeeChange}
            onDiscountChange={handleDiscountChange}
          >
            <PaymentSection
              receivedAmount={receivedAmount}
              balanceAmount={balanceAmount}
              showQrCode={showQrCode}
              onReceivedAmountChange={handleReceivedAmountChange}
              onShowQrCodeChange={handleShowQrCodeChange}
            />
          </TaxSummary>
        </form>
      ) : (
        /* EXACT REPLICA PDF INVOICE PREVIEW */
        <PreviewPane pdfPreviewRef={pdfPreviewRef} invoiceDataForPdf={invoiceDataForPdf} />
      )}

      {/* History Section */}
      <RecentInvoicesSection
        recentInvoices={recentInvoices}
        isLoadingHistory={isLoadingHistory}
        onRefresh={fetchRecentInvoices}
        onOpenGraphicalModal={handleOpenGraphicalModal}
        onOpenPdfModal={handleOpenPdfModal}
        onOpenPaymentQrModal={handleOpenPaymentQrModal}
      />

      {/* Inventory Selection Modal */}
      {inventoryPickerIndex !== null && (
        <InventoryPickerModal
          searchRef={pickerSearchRef}
          inventorySearch={inventorySearch}
          filteredInventory={filteredInventory}
          selectedInventoryId={lineItems[inventoryPickerIndex]?.inventoryId}
          onSearchChange={handleInventorySearchChange}
          onClearSearch={handleClearInventorySearch}
          onSelectItem={selectInventoryItem}
          onClose={closeInventoryPicker}
        />
      )}
      {/* Company Details, Bank & Terms Modal */}
      {isCompanyModalOpen && (
        <CompanySettingsModal
          sellerDetails={sellerDetails}
          notes={notes}
          isSavingCompany={isSavingCompany}
          onSellerFieldChange={handleSellerFieldChange}
          onNotesChange={handleNotesChange}
          onSave={handleSaveCompanySettings}
          onClose={handleCloseCompanyModal}
        />
      )}
      {/* Multi-Select Inventory Modal */}
      {isMultiSelectOpen && (
        <MultiSelectInventoryModal
          searchRef={multiSearchRef}
          multiSelectSearch={multiSelectSearch}
          filteredMultiInventory={filteredMultiInventory}
          selectedInvIds={selectedInvIds}
          onSearchChange={handleMultiSelectSearchChange}
          onClearSearch={handleClearMultiSelectSearch}
          onSelectAllFiltered={handleSelectAllFiltered}
          onClearSelection={handleClearSelection}
          onToggleItem={toggleInvSelection}
          onAddBlankRow={handleAddBlankRow}
          onAddSelectedItems={handleAddSelectedItems}
          onClose={closeMultiSelectModal}
        />
      )}
      {/* PDF Preview Modal */}
      {showPdfModal && pdfModalInvoice && (
        <PdfPreviewModal
          pdfModalInvoice={pdfModalInvoice}
          modalPdfRef={modalPdfRef}
          showQrCodePdfModal={showQrCodePdfModal}
          isDownloadingPdfModal={isDownloadingPdfModal}
          onShowQrCodeChange={handleShowQrCodePdfModalChange}
          onDownloadPdf={handleModalDownloadPdf}
          onClose={handleClosePdfModal}
        />
      )}

      {/* Graphical View Modal (Invoice Details & Inventory Images) */}
      {showGraphicalModal && graphicalModalInvoice && (
        <GraphicalViewModal
          graphicalModalInvoice={graphicalModalInvoice}
          sellerDetails={sellerDetails}
          inventoryList={inventoryList}
          onClose={handleCloseGraphicalModal}
        />
      )}
      {/* Floating Cursor Image Tooltip */}
      {hoveredImage && <CursorImageTooltip hoveredImage={hoveredImage} />}
      {/* Payment QR Generator Modal */}
      <PaymentQrModal
        isOpen={showPaymentQrModal}
        onClose={() => setShowPaymentQrModal(false)}
        invoice={paymentQrInvoice}
      />
    </div>
  );
}
