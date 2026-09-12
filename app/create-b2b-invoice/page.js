"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { toast } from "sonner";
import RefreshIcon from "@/components/RefreshIcon/RefreshIcon";
import { GST_STATES } from "@/utils/gstStates";
import InvoicePdfPreview from "@/components/InvoicePdfPreview/InvoicePdfPreview";
import { downloadInvoicePdf } from "@/utils/generatePdf";

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
    businessName: "Akash Chettri",
    phoneNo: "",
    address:
      "Garidhura Bazar line, Mirik Road, Darjeeling, West Bengal, Pin-734009, Landmark - Vicky Tea Stall",
    gstNo: "NA",
    state: "19-West Bengal",
  });

  // Line Items
  const [lineItems, setLineItems] = useState([
    {
      inventoryId: "",
      description: "",
      hsnCode: "7117",
      quantity: 1,
      unitPrice: 0,
      gstRate: 3,
    },
  ]);

  // Overall Financials
  const [shippingFee, setShippingFee] = useState(180);
  const [discount, setDiscount] = useState(0.19);
  const [receivedAmount, setReceivedAmount] = useState(500);
  const [showQrCode, setShowQrCode] = useState(true);
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
          <button
            type="button"
            className={styles.companySettingsBtn}
            onClick={() => setIsCompanyModalOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Company & Bank Info
          </button>

          {activeTab === "preview" ? (
            <button
              type="button"
              className={styles.tabBtn}
              onClick={() => setActiveTab("form")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Close Preview
            </button>
          ) : (
            <button
              type="button"
              className={styles.tabBtn}
              onClick={() => setActiveTab("preview")}
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
                  onChange={(e) => setShowQrCode(e.target.checked)}
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

              <button
                type="button"
                className={styles.printBtn}
                onClick={handlePrint}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Print
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

              <div className={styles.inputGroup}>
                <label className={styles.label}>Payment Status</label>
                <select
                  className={styles.select}
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Customer & Seller Summary */}
          <div className={styles.card}>
            <div className={styles.sellerSummaryBanner}>
              <div>
                <span className={styles.sellerBannerLabel}>Seller:</span>{" "}
                <span className={styles.sellerBannerName}>{sellerDetails.businessName || "N/A"}</span>
                <span className={styles.sellerBannerGst}> • GSTIN: {sellerDetails.gstNo || "N/A"}</span>
              </div>
            </div>

            <h3 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              Issued To (Customer)
            </h3>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Customer Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={buyerDetails.businessName}
                  onChange={(e) =>
                    setBuyerDetails({ ...buyerDetails, businessName: e.target.value })
                  }
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Contact No</label>
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
              <div className={styles.inputGroup}>
                <label className={styles.label}>Full Address</label>
                <input
                  type="text"
                  className={styles.input}
                  value={buyerDetails.address}
                  onChange={(e) =>
                    setBuyerDetails({ ...buyerDetails, address: e.target.value })
                  }
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>GSTIN Number</label>
                <input
                  type="text"
                  className={styles.input}
                  value={buyerDetails.gstNo}
                  onChange={(e) =>
                    setBuyerDetails({ ...buyerDetails, gstNo: e.target.value })
                  }
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>State</label>
                <select
                  className={styles.select}
                  value={buyerDetails.state}
                  onChange={(e) =>
                    setBuyerDetails({ ...buyerDetails, state: e.target.value })
                  }
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
                  <span>GST Total:</span>
                  <span>₹{totalGst.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping (₹):</span>
                  <input
                    type="number"
                    step="0.01"
                    style={{ width: "100px" }}
                    className={styles.tableInput}
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                  />
                </div>
                <div className={styles.summaryRow}>
                  <span>Discount (₹):</span>
                  <input
                    type="number"
                    step="0.01"
                    style={{ width: "100px" }}
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
                    style={{ width: "100px" }}
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
        <InvoicePdfPreview ref={pdfPreviewRef} invoice={invoiceDataForPdf} />
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
                    <button
                      type="button"
                      className={styles.tabBtn}
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => {
                        setInvoiceNumber(inv.invoiceNumber);
                        setInvoiceDate(
                          inv.invoiceDate
                            ? new Date(inv.invoiceDate).toISOString().split("T")[0]
                            : invoiceDate
                        );
                        setPlaceOfSupply(inv.placeOfSupply || "19-West Bengal");
                        setBuyerDetails(inv.buyerDetails || {});
                        setSellerDetails(inv.sellerDetails || sellerDetails);
                        setLineItems(
                          inv.lineItems
                            ? inv.lineItems.map((item) => ({
                                inventoryId: item.inventoryId || "",
                                description: item.description || "",
                                hsnCode: item.hsnCode || "7117",
                                quantity: item.quantity || 1,
                                unitPrice: item.unitPrice || 0,
                                gstRate: item.taxRate || 3,
                              }))
                            : []
                        );
                        setShippingFee(inv.shippingFee || 0);
                        setDiscount(inv.discount || 0);
                        setReceivedAmount(inv.receivedAmount || 0);
                        setPaymentStatus(inv.paymentStatus || "Pending");
                        setNotes(inv.notes || "");
                        setActiveTab("preview");
                      }}
                    >
                      View / PDF
                    </button>
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
      {/* Company Details, Bank & Terms Modal */}
      {isCompanyModalOpen && (
        <div className={styles.pickerOverlay} onClick={() => setIsCompanyModalOpen(false)}>
          <div className={styles.companyModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pickerHeader}>
              <div>
                <h3 className={styles.pickerTitle}>Company, Bank & Terms Settings</h3>
                <p className={styles.pickerSubtitle}>
                  Pre-filled seller information, payment bank details, and invoice terms.
                </p>
              </div>
              <button
                type="button"
                className={styles.pickerCloseBtn}
                onClick={() => setIsCompanyModalOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.companyModalBody}>
              {/* Company Details */}
              <div>
                <div className={styles.modalSubSectionTitle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Company Details
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Company Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={sellerDetails.businessName}
                      onChange={(e) =>
                        setSellerDetails({ ...sellerDetails, businessName: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Address</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={sellerDetails.address}
                      onChange={(e) =>
                        setSellerDetails({ ...sellerDetails, address: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>State</label>
                    <select
                      className={styles.select}
                      value={sellerDetails.state || "19-West Bengal"}
                      onChange={(e) =>
                        setSellerDetails({ ...sellerDetails, state: e.target.value })
                      }
                    >
                      {GST_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>GSTIN</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={sellerDetails.gstNo}
                      onChange={(e) =>
                        setSellerDetails({ ...sellerDetails, gstNo: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Bank & Payment Details */}
              <div>
                <div className={styles.modalSubSectionTitle} style={{ color: "#10b981" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                  Bank & Payment Details
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Bank Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Slice Small Finance Bank"
                      value={sellerDetails.bankName}
                      onChange={(e) =>
                        setSellerDetails({ ...sellerDetails, bankName: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Account Number</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. 033311501063323"
                      value={sellerDetails.accountNo}
                      onChange={(e) =>
                        setSellerDetails({ ...sellerDetails, accountNo: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>IFSC Code</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. NESF0000333"
                      value={sellerDetails.ifscCode}
                      onChange={(e) =>
                        setSellerDetails({ ...sellerDetails, ifscCode: e.target.value })
                      }
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>UPI Barcode / UPI ID</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. 033311501063323@slice"
                      value={sellerDetails.upiId || ""}
                      onChange={(e) =>
                        setSellerDetails({ ...sellerDetails, upiId: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div>
                <div className={styles.modalSubSectionTitle} style={{ color: "#f59e0b" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  Notes & Terms
                </div>
                <div className={styles.inputGroup}>
                  <textarea
                    rows="4"
                    className={styles.textarea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Terms & Conditions or notes..."
                  />
                </div>
              </div>
            </div>

            <div className={styles.companyModalFooter}>
              <button
                type="button"
                className={styles.companyModalSaveBtn}
                onClick={handleSaveCompanySettings}
                disabled={isSavingCompany}
              >
                {isSavingCompany ? "Saving..." : "Save & Done"}
              </button>
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
                  return (
                    <button
                      key={inv._id || inv.inventoryId}
                      type="button"
                      className={`${styles.pickerCard} ${
                        isSelected ? styles.pickerCardSelected : ""
                      }`}
                      onClick={() => toggleInvSelection(inv.inventoryId)}
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
    </div>
  );
}
