"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  return new Date(dateStr).toLocaleDateString("en-GB");
}

export default function AllInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // View / Print PDF Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showQrCode, setShowQrCode] = useState(true);

  const pdfPreviewRef = useRef(null);

  useEffect(() => {
    fetchInvoices();
  }, [search, statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = "/api/employee/b2b-invoice?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter && statusFilter !== "All")
        url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.data) {
        setInvoices(data.data);
      } else {
        toast.error("Failed to load invoices");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while fetching invoices");
    } finally {
      setLoading(false);
    }
  };

  // Archive invoice
  const handleArchive = async (id) => {
    if (!confirm("Are you sure you want to archive this invoice?")) return;

    try {
      const res = await fetch(`/api/employee/b2b-invoice?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Invoice archived successfully");
        fetchInvoices();
      } else {
        toast.error(data.error || "Failed to archive invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error archiving invoice");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (inv) => {
    const copy = JSON.parse(JSON.stringify(inv));
    if (copy.invoiceDate) {
      copy.invoiceDate = new Date(copy.invoiceDate).toISOString().split("T")[0];
    }
    setEditingInvoice(copy);
    setShowEditModal(true);
  };

  // Edit Modal Item Handlers
  const handleEditLineItemChange = (index, field, value) => {
    if (!editingInvoice) return;
    const updatedItems = [...editingInvoice.lineItems];
    updatedItems[index][field] = value;

    // Recalculate row amounts
    const qty = Number(updatedItems[index].quantity) || 0;
    const price = Number(updatedItems[index].unitPrice) || 0;
    const gstRate = Number(updatedItems[index].taxRate) || 0;

    const amount = qty * price;
    const taxAmount = (amount * gstRate) / 100;
    const totalAmount = amount + taxAmount;

    updatedItems[index].amount = amount;
    updatedItems[index].taxAmount = taxAmount;
    updatedItems[index].totalAmount = totalAmount;

    setEditingInvoice({
      ...editingInvoice,
      lineItems: updatedItems,
    });
  };

  const addEditLineItem = () => {
    if (!editingInvoice) return;
    setEditingInvoice({
      ...editingInvoice,
      lineItems: [
        ...editingInvoice.lineItems,
        {
          inventoryId: "",
          description: "New Item",
          hsnCode: "7117",
          quantity: 1,
          unitPrice: 0,
          taxRate: 3,
          amount: 0,
          taxAmount: 0,
          totalAmount: 0,
        },
      ],
    });
  };

  const removeEditLineItem = (index) => {
    if (!editingInvoice || editingInvoice.lineItems.length === 1) {
      toast.error("Invoice must have at least one line item");
      return;
    }
    const updated = editingInvoice.lineItems.filter((_, i) => i !== index);
    setEditingInvoice({
      ...editingInvoice,
      lineItems: updated,
    });
  };

  // Save Edit Submission
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setIsSavingEdit(true);

    // Recalculate totals
    const subtotal = editingInvoice.lineItems.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const totalTax = editingInvoice.lineItems.reduce(
      (sum, item) => sum + (Number(item.taxAmount) || 0),
      0
    );
    const grandTotal =
      subtotal +
      totalTax +
      Number(editingInvoice.shippingFee || 0) -
      Number(editingInvoice.discount || 0);
    const balanceAmount =
      grandTotal - Number(editingInvoice.receivedAmount || 0);

    const payload = {
      ...editingInvoice,
      subtotal,
      totalTax,
      grandTotal,
      balanceAmount,
    };

    try {
      const res = await fetch("/api/employee/b2b-invoice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Invoice updated successfully!");
        setShowEditModal(false);
        setEditingInvoice(null);
        fetchInvoices();
      } else {
        toast.error(data.error || "Failed to update invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while updating invoice");
    } finally {
      setIsSavingEdit(false);
    }
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

  // Metrics Calculations
  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + (inv.grandTotal || 0),
    0
  );
  const totalReceived = invoices.reduce(
    (sum, inv) => sum + (inv.receivedAmount || 0),
    0
  );
  const totalBalance = invoices.reduce(
    (sum, inv) => {
      const invBal =
        inv.balanceAmount !== undefined && inv.balanceAmount !== null && inv.balanceAmount !== 0
          ? inv.balanceAmount
          : (inv.grandTotal || 0) - (inv.receivedAmount || 0);
      return sum + invBal;
    },
    0
  );

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>All B2B Invoices</h1>
          <p className={styles.subtitle}>
            Manage, edit, search, and export all generated sales invoices.
          </p>
        </div>

        <Link href="/create-b2b-invoice" className={styles.createBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          + Create New Invoice
        </Link>
      </div>

      {/* Summary Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.iconBlue}`}>📄</div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Invoices</span>
            <span className={styles.metricValue}>{invoices.length}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.iconGreen}`}>₹</div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Revenue</span>
            <span className={styles.metricValue}>
              ₹{totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.iconAmber}`}>💳</div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Total Received</span>
            <span className={styles.metricValue}>
              ₹{totalReceived.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.iconRed}`}>⚠️</div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Outstanding Balance</span>
            <span className={styles.metricValue}>
              ₹{totalBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filter */}
      <div className={styles.controlBar}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search Invoice #, Customer Name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.statusSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchInvoices}
            disabled={loading}
          >
            <RefreshIcon />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className={styles.tableCard}>
        <table className={styles.invoiceTable}>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Grand Total</th>
              <th>Received</th>
              <th>Balance</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", color: "#a1a1aa", padding: "30px" }}>
                  {loading ? "Loading invoices..." : "No invoices found matching criteria."}
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const invBalance =
                  inv.balanceAmount !== undefined && inv.balanceAmount !== null && inv.balanceAmount !== 0
                    ? inv.balanceAmount
                    : Math.max(0, (inv.grandTotal || 0) - (inv.receivedAmount || 0));

                return (
                  <tr key={inv._id}>
                    <td className={styles.invNumber}>{inv.invoiceNumber}</td>
                    <td>{inv.invoiceDate ? formatDateGB(inv.invoiceDate) : "-"}</td>
                    <td className={styles.customerName}>
                      {inv.buyerDetails?.businessName || "N/A"}
                    </td>
                    <td>{inv.lineItems?.length || 0} items</td>
                    <td style={{ fontWeight: "700", color: "#34d399" }}>
                      ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
                    </td>
                    <td>₹{(inv.receivedAmount || 0).toLocaleString("en-IN")}</td>
                    <td style={{ fontWeight: "600", color: invBalance > 0 ? "#f87171" : "#a1a1aa" }}>
                      ₹{invBalance.toLocaleString("en-IN")}
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
                      <div className={styles.actionCell} style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => handleOpenEdit(inv)}
                          title="Edit Invoice"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.viewBtn}
                          onClick={() => handleOpenPdf(inv)}
                          title="View / Download PDF"
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          className={styles.archiveBtn}
                          onClick={() => handleArchive(inv._id)}
                          title="Archive"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT INVOICE MODAL */}
      {showEditModal && editingInvoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Edit Invoice #{editingInvoice.invoiceNumber}
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className={styles.modalSectionTitle}>Invoice Header</div>
              <div className={styles.modalGrid}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Invoice Number</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.invoiceNumber}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        invoiceNumber: e.target.value.toUpperCase(),
                      })
                    }
                    required
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Invoice Date</label>
                  <input
                    type="date"
                    className={styles.modalInput}
                    value={editingInvoice.invoiceDate || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        invoiceDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Place of Supply</label>
                  <select
                    className={styles.modalSelect}
                    value={editingInvoice.placeOfSupply || "19-West Bengal"}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        placeOfSupply: e.target.value,
                      })
                    }
                  >
                    {GST_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Payment Status</label>
                  <select
                    className={styles.modalSelect}
                    value={editingInvoice.paymentStatus || "Pending"}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        paymentStatus: e.target.value,
                      })
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalSectionTitle}>Customer / Buyer Info</div>
              <div className={styles.modalGrid}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Customer Name</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.buyerDetails?.businessName || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        buyerDetails: {
                          ...editingInvoice.buyerDetails,
                          businessName: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Contact No</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.buyerDetails?.phoneNo || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        buyerDetails: {
                          ...editingInvoice.buyerDetails,
                          phoneNo: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. +91 9876543210"
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>GSTIN</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.buyerDetails?.gstNo || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        buyerDetails: {
                          ...editingInvoice.buyerDetails,
                          gstNo: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Address</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.buyerDetails?.address || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        buyerDetails: {
                          ...editingInvoice.buyerDetails,
                          address: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>State</label>
                  <select
                    className={styles.modalSelect}
                    value={editingInvoice.buyerDetails?.state || "19-West Bengal"}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        buyerDetails: {
                          ...editingInvoice.buyerDetails,
                          state: e.target.value,
                        },
                      })
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

              <div className={styles.modalSectionTitle}>Line Items</div>
              {editingInvoice.lineItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 40px",
                    gap: "8px",
                    marginBottom: "8px",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    className={styles.modalInput}
                    placeholder="Description / SKU"
                    value={item.description}
                    onChange={(e) =>
                      handleEditLineItemChange(idx, "description", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className={styles.modalInput}
                    placeholder="HSN"
                    value={item.hsnCode || "7117"}
                    onChange={(e) =>
                      handleEditLineItemChange(idx, "hsnCode", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    className={styles.modalInput}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      handleEditLineItemChange(idx, "quantity", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    step="0.01"
                    className={styles.modalInput}
                    placeholder="Unit Price"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleEditLineItemChange(idx, "unitPrice", e.target.value)
                    }
                  />
                  <div style={{ color: "#34d399", fontWeight: "600", fontSize: "13px" }}>
                    ₹{(Number(item.totalAmount) || 0).toFixed(2)}
                  </div>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}
                    onClick={() => removeEditLineItem(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                style={{
                  background: "rgba(59,130,246,0.15)",
                  color: "#60a5fa",
                  border: "1px dashed #3b82f6",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  marginTop: "6px",
                }}
                onClick={addEditLineItem}
              >
                + Add Line Item
              </button>

              <div className={styles.modalSectionTitle}>Payment & Totals</div>
              <div className={styles.modalGrid}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>UPI Barcode / UPI ID</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingInvoice.sellerDetails?.upiId || ""}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        sellerDetails: {
                          ...editingInvoice.sellerDetails,
                          upiId: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. 033311501063323@slice"
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Shipping Fee (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.modalInput}
                    value={editingInvoice.shippingFee || 0}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        shippingFee: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Discount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.modalInput}
                    value={editingInvoice.discount || 0}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        discount: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Received Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.modalInput}
                    value={editingInvoice.receivedAmount || 0}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        receivedAmount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? "Saving Changes..." : "Save Invoice Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PDF / PRINT MODAL */}
      {showPdfModal && viewingInvoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ width: "880px", background: "#18181b", color: "#ffffff" }}>
            <div className={styles.pdfModalHeader} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#ffffff", fontSize: "13px", cursor: "pointer", marginRight: "12px", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#ec4899" }}
                />
                <span>Show QR Code</span>
              </label>
              <button
                type="button"
                className={styles.createBtn}
                style={{ padding: "8px 18px", background: "#10b981" }}
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
              >
                {isDownloadingPdf ? "Downloading..." : "Download PDF"}
              </button>
              <button
                type="button"
                className={styles.createBtn}
                style={{ padding: "8px 18px", background: "#6366f1" }}
                onClick={() => window.print()}
              >
                Print
              </button>
              <button
                type="button"
                className={styles.closeBtn}
                style={{ color: "#ffffff", fontSize: "24px" }}
                onClick={() => setShowPdfModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Reusable Exact Replica PDF Component */}
            <InvoicePdfPreview ref={pdfPreviewRef} invoice={viewingInvoice} showQrCode={showQrCode} />
          </div>
        </div>
      )}
    </div>
  );
}
