"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { toast } from "sonner";
import RefreshIcon from "@/components/RefreshIcon/RefreshIcon";
import { GST_STATES } from "@/utils/gstStates";
import InvoicePdfPreview from "@/components/InvoicePdfPreview/InvoicePdfPreview";

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
      inventoryId: "NL-0001",
      description: "NL-0001",
      hsnCode: "7117",
      quantity: 9,
      unitPrice: 32,
      gstRate: 3,
    },
    {
      inventoryId: "NL-0005",
      description: "NL-0005",
      hsnCode: "7117",
      quantity: 9,
      unitPrice: 35,
      gstRate: 3,
    },
  ]);

  // Overall Financials
  const [shippingFee, setShippingFee] = useState(180);
  const [discount, setDiscount] = useState(0.19);
  const [receivedAmount, setReceivedAmount] = useState(500);
  const [notes, setNotes] = useState(
    "All goods checked before dispatch.\nGoods once sold will not taken back.\nOpening video is must for any claims. We are not responsible for any damages once goods leave our premises. Any dispute will be subject to Barrackpore jurisdiction only."
  );

  useEffect(() => {
    fetchNextInvoiceId();
    fetchInventoryList();
    fetchRecentInvoices();
  }, []);

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
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = pdfPreviewRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `Invoice_${invoiceNumber || "Draft"}_${buyerDetails.businessName.replace(/\s+/g, "_") || "B2B"}.pdf`
      );
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
            className={`${styles.tabBtn} ${activeTab === "form" ? styles.activeTabBtn : ""}`}
            onClick={() => setActiveTab("form")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Form
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "preview" ? styles.activeTabBtn : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            PDF Preview
          </button>

          {activeTab === "preview" && (
            <>
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
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
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

          {/* Card 2: Seller & Buyer Details */}
          <div className={styles.twoColumnGrid}>
            {/* Seller Info */}
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Company Details
              </h3>
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

            {/* Buyer Info */}
            <div className={styles.card}>
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
                        <select
                          className={styles.tableInput}
                          value={item.inventoryId}
                          onChange={(e) =>
                            handleLineItemChange(index, "inventoryId", e.target.value)
                          }
                        >
                          <option value="">-- Select SKU --</option>
                          {inventoryList.map((inv) => (
                            <option key={inv._id || inv.inventoryId} value={inv.inventoryId}>
                              {inv.inventoryId}
                            </option>
                          ))}
                        </select>
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

            <button type="button" className={styles.addItemBtn} onClick={addLineItem}>
              + Add Item Row
            </button>
          </div>

          {/* Card 4: Financial Summary & Payment Info */}
          <div className={styles.card}>
            <div className={styles.twoColumnGrid}>
              {/* Payment & Bank Details */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Bank & Payment Details</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                  <div>
                    <label className={styles.label} style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>Bank Name</label>
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
                  <div>
                    <label className={styles.label} style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>Account Number</label>
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
                  <div>
                    <label className={styles.label} style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>IFSC Code</label>
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
                  <div>
                    <label className={styles.label} style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>UPI Barcode / UPI ID</label>
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
                <label className={styles.label} style={{ marginTop: "12px" }}>
                  Notes
                </label>
                <textarea
                  rows="4"
                  className={styles.textarea}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

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
    </div>
  );
}
