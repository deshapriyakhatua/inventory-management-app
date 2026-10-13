"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { toast } from "sonner";
import RefreshIcon from "@/components/RefreshIcon/RefreshIcon";
import { GST_STATES } from "@/utils/gstStates";
import InvoicePdfPreview from "@/components/InvoicePdfPreview/InvoicePdfPreview";
import { downloadInvoicePdf } from "@/utils/generatePdf";
import { calculatePaymentStatus } from "@/lib/paymentStatus";
import PaymentQrModal from "@/components/PaymentQrModal/PaymentQrModal";

function formatDateGB(dateStr) {
  if (!dateStr) return "";
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
  }
  return dateStr;
}

export default function CreateB2BInvoicePage() {
  const [activeTab, setActiveTab] = useState("form"); // "form" | "preview"
  const [previewInvoiceData, setPreviewInvoiceData] = useState(null);
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
  const [modalItemMeta, setModalItemMeta] = useState({});
  const [multiSelectSearch, setMultiSelectSearch] = useState("");
  const multiSearchRef = useRef(null);

  const openMultiSelectModal = () => {
    setIsMultiSelectOpen(true);
    // Pre-populate selectedInvIds and modalItemMeta with all items currently present in lineItems
    const initialMeta = {};
    const existingIds = [];
    lineItems.forEach((item) => {
      if (item.inventoryId && String(item.inventoryId).trim() !== "") {
        existingIds.push(item.inventoryId);
        initialMeta[item.inventoryId] = {
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
        };
      }
    });
    setSelectedInvIds(Array.from(new Set(existingIds)));
    setModalItemMeta(initialMeta);
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
    setModalItemMeta({});
    setMultiSelectSearch("");
  };

  const toggleInvSelection = (invId) => {
    setSelectedInvIds((prev) => {
      if (prev.includes(invId)) {
        return prev.filter((id) => id !== invId);
      } else {
        setModalItemMeta((meta) => {
          if (!meta[invId]) {
            return {
              ...meta,
              [invId]: { quantity: 1, unitPrice: 0 }
            };
          }
          return meta;
        });
        return [...prev, invId];
      }
    });
  };

  const handleSelectAllFiltered = (filteredList) => {
    const ids = filteredList.map((i) => i.inventoryId);
    setSelectedInvIds((prev) => Array.from(new Set([...prev, ...ids])));
    setModalItemMeta((prev) => {
      const nextMeta = { ...prev };
      ids.forEach((id) => {
        if (!nextMeta[id]) {
          nextMeta[id] = { quantity: 1, unitPrice: 0 };
        }
      });
      return nextMeta;
    });
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

    // Build list of inventory item rows based on selectedInvIds and modal inputs
    const updatedInvRows = selectedInvIds.map((invId) => {
      const meta = modalItemMeta[invId] || {};
      const existing = existingMap.get(invId);
      return {
        inventoryId: invId,
        description: existing?.description || invId,
        hsnCode: existing?.hsnCode || "7117",
        quantity: Number(meta.quantity) > 0 ? Number(meta.quantity) : (existing?.quantity || 1),
        unitPrice: Number(meta.unitPrice) >= 0 ? Number(meta.unitPrice) : (existing?.unitPrice || 0),
        gstRate: existing?.gstRate ?? 3,
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
    whatsAppNo: "",
    address: "",
    gstNo: "NA",
    state: "",
    email: "",
    contactPerson: "",
    pinCode: "",
  });
  const [buyersList, setBuyersList] = useState([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(false);

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
    fetchBuyers();
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

  // Fetch Saved Buyers from Database
  const fetchBuyers = async () => {
    setIsLoadingBuyers(true);
    try {
      const res = await fetch("/api/employee/buyer");
      const data = await res.json();
      if (res.ok && data.data) {
        setBuyersList(data.data);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const qBuyerId = params.get("buyerId");
          if (qBuyerId) {
            const matched = data.data.find((b) => b._id === qBuyerId);
            if (matched) {
              setSelectedBuyerId(matched._id);
              setBuyerDetails({
                businessName: matched.businessName || "",
                phoneNo: matched.phoneNo || "",
                whatsAppNo: matched.whatsAppNo || "",
                address: matched.address || "",
                gstNo: matched.gstNo || "NA",
                state: matched.state || "19-West Bengal",
                email: matched.email || "",
                contactPerson: matched.contactPerson || "",
                pinCode: matched.pinCode || "",
              });
              if (matched.state) {
                setPlaceOfSupply(matched.state);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch buyers:", err);
    } finally {
      setIsLoadingBuyers(false);
    }
  };

  const handleBuyerSelect = (buyerId) => {
    setSelectedBuyerId(buyerId);
    if (!buyerId) {
      return;
    }
    const found = buyersList.find((b) => b._id === buyerId);
    if (found) {
      setBuyerDetails({
        businessName: found.businessName || "",
        phoneNo: found.phoneNo || "",
        whatsAppNo: found.whatsAppNo || "",
        address: found.address || "",
        gstNo: found.gstNo || "NA",
        state: found.state || "19-West Bengal",
        email: found.email || "",
        contactPerson: found.contactPerson || "",
        pinCode: found.pinCode || "",
      });
      if (found.state) {
        setPlaceOfSupply(found.state);
      }
      toast.info(`Selected buyer: ${found.businessName}`);
    }
  };

  const handleClearBuyer = () => {
    setSelectedBuyerId("");
    setBuyerDetails({
      businessName: "",
      phoneNo: "",
      whatsAppNo: "",
      address: "",
      gstNo: "NA",
      state: "",
      email: "",
      contactPerson: "",
      pinCode: "",
    });
  };

  // Fetch Next Invoice ID (starts from CZ-A9735, reuses lowest deleted ID)
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
  const itemsGst = calculatedRows.reduce((sum, item) => sum + item.gstAmt, 0);
  const shippingVal = Number(shippingFee) || 0;
  const shippingGst = (shippingVal * 3) / 100;
  const totalGst = itemsGst + shippingGst;
  const grandTotal =
    subtotal + shippingVal + totalGst - Number(discount || 0);
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

  // Reset Form for next invoice
  const resetForm = () => {
    setSelectedBuyerId("");
    setBuyerDetails({
      businessName: "",
      phoneNo: "",
      whatsAppNo: "",
      address: "",
      gstNo: "NA",
      state: "",
      email: "",
      contactPerson: "",
      pinCode: "",
    });
    setLineItems([
      {
        inventoryId: "",
        description: "",
        hsnCode: "7117",
        quantity: 0,
        unitPrice: 0,
        gstRate: 3,
      },
    ]);
    setShippingFee(150);
    setDiscount(0);
    setReceivedAmount(0);
    setShowQrCode(false);
    setPlaceOfSupply("19-West Bengal");
    setPaymentStatus("Pending");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
  };

  const handleClosePreview = () => {
    setActiveTab("form");
    setPreviewInvoiceData(null);
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
        const savedInvoice = {
          ...(data.invoice || payload),
          showQrCode,
        };
        setPreviewInvoiceData(savedInvoice);
        setActiveTab("preview");
        fetchRecentInvoices();
        fetchBuyers();
        resetForm();
        fetchNextInvoiceId();
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
    const activeInvoice = previewInvoiceData || invoiceDataForPdf;
    try {
      const fileName = `Invoice_${activeInvoice.invoiceNumber || "Draft"}_${(
        activeInvoice.buyerDetails?.businessName || "B2B"
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

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Create B2B Invoice</h1>
          <p className={styles.subtitle}>
            Generate exact-match Tax Invoices (.pdf) for B2B selling.
          </p>
        </div>

        <div className={styles.actionHeaderButtons}>
          {activeTab === "preview" ? (
            <button
              type="button"
              className={styles.tabBtn}
              onClick={handleClosePreview}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              {previewInvoiceData ? "Create New Invoice" : "Close Preview"}
            </button>
          ) : (
            <button
              type="button"
              className={styles.tabBtn}
              onClick={() => {
                setPreviewInvoiceData(null);
                setActiveTab("preview");
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              PDF Preview
            </button>
          )}

          {activeTab === "preview" && (
            <>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#e4e4e7", fontSize: "13px", cursor: "pointer", marginRight: "8px", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => {
                    const nextVal = e.target.checked;
                    setShowQrCode(nextVal);
                    if (previewInvoiceData) {
                      setPreviewInvoiceData((prev) => (prev ? { ...prev, showQrCode: nextVal } : null));
                    }
                  }}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#ec4899" }}
                />
                <span>Print QR Code</span>
              </label>

              <button
                type="button"
                className={styles.downloadPdfBtn}
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      {activeTab === "form" ? (
        <form onSubmit={handleSubmitInvoice}>
          {/* Card 1: Invoice Meta */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Invoice Header Info
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Invoice No</label>
                <div className={styles.idRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. CZ-A9743"
                    required
                  />
                  <button
                    type="button"
                    className={styles.generateBtn}
                    onClick={fetchNextInvoiceId}
                    disabled={isGeneratingId}
                  >
                    {isGeneratingId ? "..." : "Generate"}
                  </button>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Place of Supply</label>
                <select
                  className={styles.select}
                  value={placeOfSupply}
                  onChange={(e) => {
                    const selectedState = e.target.value;
                    setPlaceOfSupply(selectedState);
                    setBuyerDetails((prev) => ({
                      ...prev,
                      state: selectedState,
                    }));
                  }}
                >
                  {GST_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Customer / Buyer */}
          <div className={styles.card}>
            {/* Header of Customer Section */}
            <div className={styles.customerSectionHeader}>
              <div className={styles.customerHeaderTitle}>
                <div className={styles.customerHeaderIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h3 className={styles.customerTitleText}>Issued To (Customer)</h3>
                  <span className={styles.customerSubtitleText}>Billing and delivery recipient information</span>
                </div>
              </div>

              {selectedBuyerId && (
                <div className={styles.selectedBuyerBadge}>
                  <span>✓ Saved Buyer Selected</span>
                  <button
                    type="button"
                    onClick={handleClearBuyer}
                    className={styles.clearBuyerBtn}
                    title="Clear to enter a new customer"
                  >
                    Clear / New
                  </button>
                </div>
              )}
            </div>

            {/* Quick Choose from Saved Buyers */}
            <div className={styles.buyerSelectContainer}>
              <label className={styles.buyerSelectLabel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Quick Fill from Saved Customers ({buyersList.length}):</span>
              </label>
              <div className={styles.buyerSelectRow}>
                <select
                  className={styles.buyerDropdown}
                  value={selectedBuyerId}
                  onChange={(e) => handleBuyerSelect(e.target.value)}
                >
                  <option value="">-- Choose an existing customer (or enter details below) --</option>
                  {buyersList.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.businessName} {b.phoneNo ? `• ${b.phoneNo}` : ""} {b.state ? `• ${b.state}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={fetchBuyers}
                  title="Refresh saved customers"
                  className={styles.buyerRefreshBtn}
                >
                  <RefreshIcon isSpinning={isLoadingBuyers} size={15} />
                </button>
              </div>
            </div>

            {/* Customer Inputs - Split into logical, spacious rows */}
            <div className={styles.customerFormStack}>
              {/* Row 1: Business / Customer Name (Full Width, Prominent) */}
              <div className={styles.formRowSingle}>
                <label className={styles.fieldLabel}>Customer / Company Name <span className={styles.reqStar}>*</span></label>
                <input
                  type="text"
                  className={`${styles.input} ${styles.inputPrimary}`}
                  list="buyers-autocomplete"
                  value={buyerDetails.businessName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = buyersList.find(
                      (b) => b.businessName?.toLowerCase() === val.trim().toLowerCase()
                    );
                    if (matched) {
                      setSelectedBuyerId(matched._id);
                      setBuyerDetails({
                        businessName: matched.businessName,
                        phoneNo: matched.phoneNo || "",
                        whatsAppNo: matched.whatsAppNo || "",
                        address: matched.address || "",
                        gstNo: matched.gstNo || "NA",
                        state: matched.state || "19-West Bengal",
                        email: matched.email || "",
                        contactPerson: matched.contactPerson || "",
                        pinCode: matched.pinCode || "",
                      });
                      if (matched.state) setPlaceOfSupply(matched.state);
                    } else {
                      setSelectedBuyerId("");
                      setBuyerDetails({ ...buyerDetails, businessName: val });
                    }
                  }}
                  placeholder="e.g. Acme Retailers / Rahul Sharma"
                  required
                />
                <datalist id="buyers-autocomplete">
                  {buyersList.map((b) => (
                    <option key={b._id} value={b.businessName}>
                      {b.phoneNo ? `Phone: ${b.phoneNo}` : ""} {b.state ? `(${b.state})` : ""}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Row 2: Contact Person | Phone Number | WhatsApp Number */}
              <div className={styles.formRow3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Contact Person</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={buyerDetails.contactPerson || ""}
                    onChange={(e) =>
                      setBuyerDetails({ ...buyerDetails, contactPerson: e.target.value })
                    }
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Phone / Mobile</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={buyerDetails.phoneNo || ""}
                    onChange={(e) =>
                      setBuyerDetails({ ...buyerDetails, phoneNo: e.target.value })
                    }
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    <span>WhatsApp Number</span>
                    <span className={styles.waTag}>WA</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={buyerDetails.whatsAppNo || ""}
                    onChange={(e) =>
                      setBuyerDetails({ ...buyerDetails, whatsAppNo: e.target.value })
                    }
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>

              {/* Row 3: GSTIN Number | State | PIN Code */}
              <div className={styles.formRow3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>GSTIN Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={buyerDetails.gstNo || ""}
                    onChange={(e) =>
                      setBuyerDetails({ ...buyerDetails, gstNo: e.target.value })
                    }
                    placeholder="e.g. 19ABCDE1234F1Z5 or NA"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>State of Supply</label>
                  <select
                    className={styles.select}
                    value={buyerDetails.state || "19-West Bengal"}
                    onChange={(e) => {
                      const selectedState = e.target.value;
                      setBuyerDetails({ ...buyerDetails, state: selectedState });
                      if (selectedState) setPlaceOfSupply(selectedState);
                    }}
                  >
                    {GST_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>PIN Code</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={buyerDetails.pinCode || ""}
                    onChange={(e) =>
                      setBuyerDetails({ ...buyerDetails, pinCode: e.target.value })
                    }
                    placeholder="e.g. 700090"
                  />
                </div>
              </div>

              {/* Row 4: Email Address */}
              <div className={styles.formRowSingle}>
                <label className={styles.fieldLabel}>Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  value={buyerDetails.email || ""}
                  onChange={(e) =>
                    setBuyerDetails({ ...buyerDetails, email: e.target.value })
                  }
                  placeholder="e.g. customer@example.com"
                />
              </div>

              {/* Row 5: Full Address (Spacious Textarea) */}
              <div className={styles.formRowSingle}>
                <div className={styles.addressLabelRow}>
                  <label className={styles.fieldLabel}>Full Billing & Shipping Address</label>
                  <span className={styles.addressHint}>Street, shop no., locality & landmark</span>
                </div>
                <textarea
                  rows={3}
                  className={`${styles.textarea} ${styles.addressTextarea}`}
                  value={buyerDetails.address || ""}
                  onChange={(e) =>
                    setBuyerDetails({ ...buyerDetails, address: e.target.value })
                  }
                  placeholder="e.g. 12/A, Ground Floor, Central Market, Beside HDFC Bank, Kolkata - 700001"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Line Items */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              Items List
            </h3>

            <div className={styles.tableContainer}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>Select Inventory</th>
                    <th style={{ width: "25%" }}>Description</th>
                    <th style={{ width: "10%" }}>HSN/SAC</th>
                    <th style={{ width: "10%" }}>Qty</th>
                    <th style={{ width: "12%" }}>Unit price (₹)</th>
                    <th style={{ width: "8%" }}>GST %</th>
                    <th style={{ width: "10%" }}>Total (₹)</th>
                    <th style={{ width: "5%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedRows.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {(() => {
                          const selectedInv = inventoryList.find(
                            (inv) => inv.inventoryId === item.inventoryId
                          );
                          return (
                            <button
                              type="button"
                              className={`${styles.inventoryPickerBtn} ${
                                item.inventoryId ? styles.inventoryPickerBtnFilled : ""
                              }`}
                              onClick={() => openInventoryPicker(index)}
                              onMouseEnter={(e) => {
                                if (selectedInv?.imageUrl) {
                                  setHoveredImage({
                                    url: selectedInv.imageUrl,
                                    id: selectedInv.inventoryId,
                                    x: e.clientX,
                                    y: e.clientY,
                                  });
                                }
                              }}
                              onMouseMove={(e) => {
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
                              }}
                              onMouseLeave={() => setHoveredImage(null)}
                              title="Click to select inventory item"
                            >
                              {selectedInv?.imageUrl ? (
                                <img
                                  src={selectedInv.imageUrl}
                                  alt={item.inventoryId}
                                  className={styles.pickerBtnImg}
                                />
                              ) : (
                                <span className={styles.pickerBtnIcon}>
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                  </svg>
                                </span>
                              )}
                              <span
                                className={
                                  item.inventoryId
                                    ? styles.pickerBtnId
                                    : styles.pickerBtnPlaceholder
                                }
                              >
                                {item.inventoryId || "Select Inventory..."}
                              </span>
                              <span className={styles.pickerBtnChevron}>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </span>
                            </button>
                          );
                        })()}
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={item.description}
                          onChange={(e) =>
                            handleLineItemChange(index, "description", e.target.value)
                          }
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.tableInput}
                          value={item.hsnCode}
                          onChange={(e) =>
                            handleLineItemChange(index, "hsnCode", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className={styles.tableInput}
                          value={item.quantity}
                          onChange={(e) =>
                            handleLineItemChange(index, "quantity", e.target.value)
                          }
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={styles.tableInput}
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleLineItemChange(index, "unitPrice", e.target.value)
                          }
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          className={styles.tableInput}
                          value={item.gstRate}
                          onChange={(e) =>
                            handleLineItemChange(index, "gstRate", e.target.value)
                          }
                        />
                      </td>
                      <td style={{ fontWeight: "600", color: "#34d399" }}>
                        ₹{item.total.toFixed(2)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeLineItem(index)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" className={styles.addItemBtn} onClick={openMultiSelectModal}>
              + Add Item Row
            </button>
          </div>

          {/* Card 4: Financial Summary */}
          <div className={styles.card}>
            <div className={styles.summaryContainer}>
              {/* Summary Calculations */}
              <div className={styles.summaryBox}>
                <div className={styles.summaryRow}>
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping (₹):</span>
                  <input
                    type="number"
                    step="0.01"
                    style={{ width: "100px", textAlign: "end" }}
                    className={styles.tableInput}
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                  />
                </div>
                <div className={styles.summaryRow}>
                  <span>GST Total:</span>
                  <span>₹{totalGst.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Discount (₹):</span>
                  <input
                    type="number"
                    step="0.01"
                    style={{ width: "100px", textAlign: "end" }}
                    className={styles.tableInput}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
                <div className={`${styles.summaryRow} ${styles.grandTotalRow}`}>
                  <span>Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Received (₹):</span>
                  <input
                    type="number"
                    step="0.01"
                    style={{ width: "100px", textAlign: "end" }}
                    className={styles.tableInput}
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                  />
                </div>
                <div className={styles.summaryRow} style={{ fontWeight: "700", color: "#f87171" }}>
                  <span>Balance:</span>
                  <span>₹{balanceAmount.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow} style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#e4e4e7", fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      checked={showQrCode}
                      onChange={(e) => setShowQrCode(e.target.checked)}
                      style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#ec4899" }}
                    />
                    <span>Show QR Code on Invoice</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving Invoice..." : "Save Invoice & Preview PDF"}
            </button>
          </div>
        </form>
      ) : (
        /* EXACT REPLICA PDF INVOICE PREVIEW */
        <InvoicePdfPreview
          ref={pdfPreviewRef}
          invoice={{
            ...(previewInvoiceData || invoiceDataForPdf),
            showQrCode,
          }}
          showQrCode={showQrCode}
        />
      )}

      {/* History Section */}
      <div className={styles.recentSection}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 className={styles.recentTitle} style={{ marginBottom: 0 }}>
            Recent B2B Invoices ({recentInvoices.length})
          </h2>
          <button
            type="button"
            className={styles.tabBtn}
            onClick={fetchRecentInvoices}
            disabled={isLoadingHistory}
          >
            <RefreshIcon />
            Refresh History
          </button>
        </div>

        <table className={styles.invoiceListTable}>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Grand Total</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentInvoices.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", color: "#a1a1aa", padding: "20px" }}>
                  {isLoadingHistory ? "Loading invoices..." : "No B2B invoices generated yet."}
                </td>
              </tr>
            ) : (
              recentInvoices.map((inv) => (
                <tr key={inv._id}>
                  <td style={{ fontWeight: "700", color: "#60a5fa" }}>
                    {inv.invoiceNumber}
                  </td>
                  <td>
                    {inv.invoiceDate ? formatDateGB(inv.invoiceDate) : "-"}
                  </td>
                  <td>{inv.buyerDetails?.businessName || "N/A"}</td>
                  <td>{inv.lineItems?.length || 0} items</td>
                  <td style={{ fontWeight: "700", color: "#34d399" }}>
                    ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
                  </td>
                  <td style={{ fontWeight: "600", color: "#f87171" }}>
                    ₹{(inv.balanceAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        inv.paymentStatus === "Paid"
                          ? styles.statusPaid
                          : inv.paymentStatus === "Pending"
                          ? styles.statusPending
                          : inv.paymentStatus === "Partially Paid"
                          ? styles.statusPartial
                          : styles.statusCancelled
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <div className={styles.recentActionGroup}>
                      <button
                        type="button"
                        className={styles.recentViewBtn}
                        onClick={() => handleOpenGraphicalModal(inv)}
                        title="View Graphical Invoice & Inventory Images"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                      </button>
                      <button
                        type="button"
                        className={styles.recentPdfBtn}
                        onClick={() => handleOpenPdfModal(inv)}
                        title="View & Download Invoice PDF"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        PDF
                      </button>
                      {(inv.paymentStatus === "Pending" ||
                        inv.paymentStatus === "Partially Paid" ||
                        (inv.balanceAmount !== undefined
                          ? inv.balanceAmount > 0
                          : (inv.grandTotal || 0) - (inv.receivedAmount || 0) > 0)) && (
                        <button
                          type="button"
                          className={styles.recentQrBtn}
                          onClick={() => handleOpenPaymentQrModal(inv)}
                          title="Generate Custom Payment QR for Remaining Balance"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                          </svg>
                          Payment QR
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inventory Selection Modal */}
      {inventoryPickerIndex !== null && (
        <div className={styles.pickerOverlay} onClick={closeInventoryPicker}>
          <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.pickerHeader}>
              <div>
                <h3 className={styles.pickerTitle}>Select Inventory Item</h3>
                <p className={styles.pickerSubtitle}>
                  Choose an inventory item to insert into the invoice line item.
                </p>
              </div>
              <button
                type="button"
                className={styles.pickerCloseBtn}
                onClick={closeInventoryPicker}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className={styles.pickerSearch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.pickerSearchIcon}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                ref={pickerSearchRef}
                type="text"
                className={styles.pickerSearchInput}
                placeholder="Search by Inventory ID or category..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
              {inventorySearch && (
                <button
                  type="button"
                  className={styles.pickerSearchClear}
                  onClick={() => setInventorySearch("")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Grid */}
            <div className={styles.pickerGrid}>
              {filteredInventory.length === 0 ? (
                <div className={styles.pickerEmpty}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span>No inventory items found.</span>
                </div>
              ) : (
                filteredInventory.map((inv) => {
                  const isSelected =
                    lineItems[inventoryPickerIndex]?.inventoryId === inv.inventoryId;
                  return (
                    <button
                      key={inv._id || inv.inventoryId}
                      type="button"
                      className={`${styles.pickerCard} ${
                        isSelected ? styles.pickerCardSelected : ""
                      }`}
                      onClick={() => selectInventoryItem(inv)}
                    >
                      <div className={styles.pickerCardImg}>
                        {inv.imageUrl ? (
                          <img src={inv.imageUrl} alt={inv.inventoryId} />
                        ) : (
                          <span className={styles.pickerCardNoImg}>No Image</span>
                        )}
                        {isSelected && (
                          <span className={styles.pickerSelectedTick}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </span>
                        )}
                      </div>
                      <span className={styles.pickerCardId}>{inv.inventoryId}</span>
                      {inv.currentStock !== undefined && (
                        <span
                          className={`${styles.pickerCardStock} ${
                            inv.currentStock <= 5 ? styles.pickerCardLowStock : ""
                          }`}
                        >
                          Stock: {inv.currentStock ?? 0}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Select Inventory Modal */}
      {isMultiSelectOpen && (
        <div className={styles.pickerOverlay} onClick={closeMultiSelectModal}>
          <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.pickerHeader}>
              <div>
                <h3 className={styles.pickerTitle}>Select Inventory Items</h3>
                <p className={styles.pickerSubtitle}>
                  Choose one or multiple items to batch-add to the invoice.
                </p>
              </div>
              <button
                type="button"
                className={styles.pickerCloseBtn}
                onClick={closeMultiSelectModal}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className={styles.pickerSearch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.pickerSearchIcon}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                ref={multiSearchRef}
                type="text"
                className={styles.pickerSearchInput}
                placeholder="Search by Inventory ID or category..."
                value={multiSelectSearch}
                onChange={(e) => setMultiSelectSearch(e.target.value)}
              />
              {multiSelectSearch && (
                <button
                  type="button"
                  className={styles.pickerSearchClear}
                  onClick={() => setMultiSelectSearch("")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Sub-bar with count & quick select actions */}
            <div className={styles.multiSelectBar}>
              <span className={styles.selectedCountTag}>
                {selectedInvIds.length} item{selectedInvIds.length !== 1 ? "s" : ""} selected
              </span>
              <div className={styles.quickSelectActions}>
                <button
                  type="button"
                  className={styles.quickSelectBtn}
                  onClick={() => handleSelectAllFiltered(filteredMultiInventory)}
                >
                  Select All Filtered
                </button>
                {selectedInvIds.length > 0 && (
                  <button
                    type="button"
                    className={styles.quickSelectBtn}
                    style={{ color: "#f87171" }}
                    onClick={handleClearSelection}
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Items */}
            <div className={styles.pickerGrid}>
              {filteredMultiInventory.length === 0 ? (
                <div className={styles.pickerEmpty}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span>No inventory items found.</span>
                </div>
              ) : (
                filteredMultiInventory.map((inv) => {
                  const isSelected = selectedInvIds.includes(inv.inventoryId);
                  const itemMeta = modalItemMeta[inv.inventoryId] || { quantity: 1, unitPrice: 0 };
                  return (
                    <div
                      key={inv._id || inv.inventoryId}
                      className={`${styles.pickerCard} ${
                        isSelected ? styles.pickerCardSelected : ""
                      }`}
                      onClick={() => toggleInvSelection(inv.inventoryId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleInvSelection(inv.inventoryId);
                        }
                      }}
                    >
                      <div className={styles.pickerCardImg}>
                        {inv.imageUrl ? (
                          <img src={inv.imageUrl} alt={inv.inventoryId} />
                        ) : (
                          <span className={styles.pickerCardNoImg}>No Image</span>
                        )}
                        {isSelected && (
                          <span className={styles.pickerSelectedTick}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </span>
                        )}
                      </div>
                      <span className={styles.pickerCardId}>{inv.inventoryId}</span>
                      {inv.currentStock !== undefined && (
                        <span
                          className={`${styles.pickerCardStock} ${
                            inv.currentStock <= 5 ? styles.pickerCardLowStock : ""
                          }`}
                        >
                          Stock: {inv.currentStock ?? 0}
                        </span>
                      )}

                      {/* Quantity & Price inputs for selected card */}
                      {isSelected && (
                        <div
                          className={styles.pickerCardInputs}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.pickerInputCol}>
                            <label className={styles.pickerInputLabel}>Qty</label>
                            <input
                              type="number"
                              min="1"
                              className={styles.pickerNumInput}
                              value={itemMeta.quantity ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value, 10) || 1);
                                setModalItemMeta((prev) => ({
                                  ...prev,
                                  [inv.inventoryId]: {
                                    ...prev[inv.inventoryId],
                                    quantity: val,
                                  },
                                }));
                              }}
                            />
                          </div>
                          <div className={styles.pickerInputCol}>
                            <label className={styles.pickerInputLabel}>Price (₹)</label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0"
                              className={styles.pickerNumInput}
                              value={itemMeta.unitPrice ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0);
                                setModalItemMeta((prev) => ({
                                  ...prev,
                                  [inv.inventoryId]: {
                                    ...prev[inv.inventoryId],
                                    unitPrice: val,
                                  },
                                }));
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className={styles.multiSelectFooter}>
              <button
                type="button"
                className={styles.addBlankBtn}
                onClick={handleAddBlankRow}
              >
                + Add Blank Custom Row
              </button>

              <button
                type="button"
                className={styles.addSelectedBtn}
                onClick={handleAddSelectedItems}
              >
                {selectedInvIds.length > 0
                  ? `Apply Selection (${selectedInvIds.length} Item${selectedInvIds.length !== 1 ? "s" : ""})`
                  : "Apply (0 Items Selected)"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PDF Preview Modal */}
      {showPdfModal && pdfModalInvoice && (
        <div className={styles.pdfModalOverlay} onClick={() => setShowPdfModal(false)}>
          <div
            className={styles.pdfModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#ffffff", fontSize: "13px", cursor: "pointer", marginRight: "12px", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={showQrCodePdfModal}
                  onChange={(e) => setShowQrCodePdfModal(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#ec4899" }}
                />
                <span>Show QR Code</span>
              </label>
              <button
                type="button"
                className={styles.downloadPdfBtn}
                style={{ padding: "8px 18px", background: "#10b981" }}
                onClick={handleModalDownloadPdf}
                disabled={isDownloadingPdfModal}
              >
                {isDownloadingPdfModal ? "Downloading..." : "Download PDF"}
              </button>
              <button
                type="button"
                className={styles.pickerCloseBtn}
                style={{ color: "#ffffff", fontSize: "20px" }}
                onClick={() => setShowPdfModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Reusable Exact Replica PDF Component */}
            <InvoicePdfPreview ref={modalPdfRef} invoice={pdfModalInvoice} showQrCode={showQrCodePdfModal} />
          </div>
        </div>
      )}

      {/* Graphical View Modal (Invoice Details & Inventory Images) */}
      {showGraphicalModal && graphicalModalInvoice && (
        <div className={styles.pickerOverlay} onClick={() => setShowGraphicalModal(false)}>
          <div className={styles.graphicalModal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.pickerHeader}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h3 className={styles.pickerTitle} style={{ margin: 0 }}>
                    Invoice #{graphicalModalInvoice.invoiceNumber}
                  </h3>
                  <span
                    className={`${styles.statusBadge} ${
                      graphicalModalInvoice.paymentStatus === "Paid"
                        ? styles.statusPaid
                        : graphicalModalInvoice.paymentStatus === "Pending"
                        ? styles.statusPending
                        : graphicalModalInvoice.paymentStatus === "Partially Paid"
                        ? styles.statusPartial
                        : styles.statusCancelled
                    }`}
                  >
                    {graphicalModalInvoice.paymentStatus}
                  </span>
                </div>
                <p className={styles.pickerSubtitle} style={{ marginTop: "4px" }}>
                  Date: {formatDateGB(graphicalModalInvoice.invoiceDate)} • Place of Supply: {graphicalModalInvoice.placeOfSupply || "19-West Bengal"}
                </p>
              </div>
              <button
                type="button"
                className={styles.pickerCloseBtn}
                onClick={() => setShowGraphicalModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className={styles.graphicalModalBody}>
              {/* Customer & Seller Grid */}
              <div className={styles.graphicalGrid2}>
                {/* Customer Card */}
                <div className={styles.graphicalInfoBox}>
                  <div className={styles.graphicalInfoTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    Customer Info
                  </div>
                  <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "15px" }}>
                    {graphicalModalInvoice.buyerDetails?.businessName || "N/A"}
                  </div>
                  {graphicalModalInvoice.buyerDetails?.phoneNo && (
                    <div className={styles.graphicalInfoText}>
                      Phone: {graphicalModalInvoice.buyerDetails.phoneNo}
                    </div>
                  )}
                  {graphicalModalInvoice.buyerDetails?.address && (
                    <div className={styles.graphicalInfoText}>
                      Address: {graphicalModalInvoice.buyerDetails.address}
                    </div>
                  )}
                  <div className={styles.graphicalInfoText}>
                    GSTIN: {graphicalModalInvoice.buyerDetails?.gstNo || "NA"} | State: {graphicalModalInvoice.buyerDetails?.state || "19-West Bengal"}
                  </div>
                </div>

                {/* Seller Card */}
                <div className={styles.graphicalInfoBox}>
                  <div className={styles.graphicalInfoTitle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Seller Details
                  </div>
                  <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "15px" }}>
                    {graphicalModalInvoice.sellerDetails?.businessName || sellerDetails.businessName}
                  </div>
                  <div className={styles.graphicalInfoText}>
                    GSTIN: {graphicalModalInvoice.sellerDetails?.gstNo || sellerDetails.gstNo}
                  </div>
                  {graphicalModalInvoice.sellerDetails?.bankName && (
                    <div className={styles.graphicalInfoText}>
                      Bank: {graphicalModalInvoice.sellerDetails.bankName} (A/C: {graphicalModalInvoice.sellerDetails.accountNo})
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Graphical View */}
              <div>
                <div className={styles.graphicalInfoTitle} style={{ marginBottom: "10px", color: "#ec4899" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                  Items & Inventory Images ({graphicalModalInvoice.lineItems?.length || 0})
                </div>

                <div className={styles.graphicalItemsContainer}>
                  {graphicalModalInvoice.lineItems?.map((item, idx) => {
                    const matchedInv = inventoryList.find(
                      (inv) => inv.inventoryId === item.inventoryId
                    );
                    const imgUrl = matchedInv?.imageUrl || item.imageUrl;
                    const qty = Number(item.quantity) || 1;
                    const price = Number(item.unitPrice) || 0;
                    const subtotalAmt = item.amount !== undefined ? Number(item.amount) : qty * price;
                    const taxRate = Number(item.taxRate !== undefined ? item.taxRate : item.gstRate) || 0;
                    const taxAmt = item.taxAmount !== undefined ? Number(item.taxAmount) : (subtotalAmt * taxRate) / 100;
                    const totalAmt = item.totalAmount !== undefined ? Number(item.totalAmount) : subtotalAmt + taxAmt;

                    return (
                      <div key={idx} className={styles.graphicalItemCard}>
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.inventoryId || item.description}
                            className={styles.graphicalItemImg}
                          />
                        ) : (
                          <div className={styles.graphicalItemNoImg}>No Image</div>
                        )}

                        <div className={styles.graphicalItemDetails}>
                          {item.inventoryId && (
                            <span className={styles.graphicalItemIdTag}>
                              {item.inventoryId}
                            </span>
                          )}
                          <div className={styles.graphicalItemDesc}>{item.description || "Line Item"}</div>
                          <div className={styles.graphicalItemMeta}>
                            <span>HSN: {item.hsnCode || "7117"}</span>
                            <span>•</span>
                            <span>Qty: {qty}</span>
                            <span>•</span>
                            <span>Unit Price: ₹{price.toFixed(2)}</span>
                            <span>•</span>
                            <span>GST: {taxRate}% (₹{taxAmt.toFixed(2)})</span>
                          </div>
                        </div>

                        <div className={styles.graphicalItemPricing}>
                          <div className={styles.graphicalItemTotal}>
                            ₹{totalAmt.toFixed(2)}
                          </div>
                          <div className={styles.graphicalItemSub}>
                            Sub: ₹{subtotalAmt.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Summary */}
              <div className={styles.summaryContainer} style={{ marginTop: 0 }}>
                <div className={styles.summaryBox} style={{ width: "100%" }}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal:</span>
                    <span>₹{(graphicalModalInvoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {graphicalModalInvoice.shippingFee > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Shipping Fee:</span>
                      <span>₹{(graphicalModalInvoice.shippingFee || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className={styles.summaryRow}>
                    <span>GST Total:</span>
                    <span>₹{(graphicalModalInvoice.totalTax || 0).toFixed(2)}</span>
                  </div>
                  {graphicalModalInvoice.discount > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Discount:</span>
                      <span>- ₹{(graphicalModalInvoice.discount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`${styles.summaryRow} ${styles.grandTotalRow}`}>
                    <span>Grand Total:</span>
                    <span>₹{(graphicalModalInvoice.grandTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Received Amount:</span>
                    <span>₹{(graphicalModalInvoice.receivedAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow} style={{ fontWeight: "700", color: "#f87171" }}>
                    <span>Balance Due:</span>
                    <span>₹{(graphicalModalInvoice.balanceAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes if present */}
              {graphicalModalInvoice.notes && (
                <div className={styles.graphicalInfoBox}>
                  <div className={styles.graphicalInfoTitle} style={{ color: "#f59e0b" }}>
                    Notes & Terms
                  </div>
                  <div className={styles.graphicalInfoText} style={{ whiteSpace: "pre-line", fontSize: "13px", color: "#a1a1aa" }}>
                    {graphicalModalInvoice.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Floating Cursor Image Tooltip */}
      {hoveredImage && (
        <div
          className={styles.cursorImageTooltip}
          style={{
            left: `${Math.min(hoveredImage.x + 20, typeof window !== "undefined" ? window.innerWidth - 250 : 800)}px`,
            top: `${Math.min(hoveredImage.y + 20, typeof window !== "undefined" ? window.innerHeight - 270 : 600)}px`,
          }}
        >
          <img
            src={hoveredImage.url}
            alt={hoveredImage.id}
            className={styles.cursorTooltipImg}
          />
          {hoveredImage.id && (
            <div className={styles.cursorTooltipTag}>{hoveredImage.id}</div>
          )}
        </div>
      )}
      {/* Payment QR Generator Modal */}
      <PaymentQrModal
        isOpen={showPaymentQrModal}
        onClose={() => setShowPaymentQrModal(false)}
        invoice={paymentQrInvoice}
      />
    </div>
  );
}
