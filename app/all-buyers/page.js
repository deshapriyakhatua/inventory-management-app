"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { toast } from "sonner";
import RefreshIcon from "@/components/RefreshIcon/RefreshIcon";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import { GST_STATES } from "@/utils/gstStates";

function Avatar({ name = "" }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={styles.avatar}
      style={{ background: `hsl(${hue}, 60%, 35%)` }}
      aria-hidden="true"
    >
      {initials || "B"}
    </div>
  );
}

function copyToClipboard(text, label = "Text") {
  if (!text) return;
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied to clipboard!`),
    () => toast.error("Failed to copy to clipboard")
  );
}

function formatINR(val) {
  const num = Number(val) || 0;
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function AllBuyersPage() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("ALL");
  const [sortBy, setSortBy] = useState("name_asc");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [viewingBuyer, setViewingBuyer] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Archive / Delete Confirmation
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState("archive"); // "archive" | "restore"
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    businessName: "",
    contactPerson: "",
    phoneNo: "",
    email: "",
    address: "",
    state: "19-West Bengal",
    pinCode: "",
    gstNo: "NA",
    notes: "",
  });

  // Fetch Buyers
  const fetchBuyers = async () => {
    setRefreshing(true);
    try {
      const url = `/api/employee/buyer?showArchived=${showArchived}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.data) {
        setBuyers(data.data);
      } else {
        toast.error(data.error || "Failed to load buyers");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while loading buyers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, [showArchived]);

  // Open Add Buyer Modal
  const handleOpenAdd = () => {
    setEditingBuyer(null);
    setFormData({
      businessName: "",
      contactPerson: "",
      phoneNo: "",
      email: "",
      address: "",
      state: "19-West Bengal",
      pinCode: "",
      gstNo: "NA",
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Open Edit Buyer Modal
  const handleOpenEdit = (buyer) => {
    setEditingBuyer(buyer);
    setFormData({
      businessName: buyer.businessName || "",
      contactPerson: buyer.contactPerson || "",
      phoneNo: buyer.phoneNo || "",
      email: buyer.email || "",
      address: buyer.address || "",
      state: buyer.state || "19-West Bengal",
      pinCode: buyer.pinCode || "",
      gstNo: buyer.gstNo || "NA",
      notes: buyer.notes || "",
    });
    setIsModalOpen(true);
  };

  // Handle Save Buyer (Create or Update)
  const handleSaveBuyer = async (e) => {
    e.preventDefault();
    if (!formData.businessName.trim()) {
      toast.error("Buyer / Company Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const method = editingBuyer ? "PUT" : "POST";
      const payload = editingBuyer
        ? { _id: editingBuyer._id, ...formData }
        : formData;

      const res = await fetch("/api/employee/buyer", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          editingBuyer
            ? "Buyer updated successfully!"
            : "Buyer added successfully!"
        );
        setIsModalOpen(false);
        fetchBuyers();
      } else {
        toast.error(data.error || "Failed to save buyer");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving buyer");
    } finally {
      setIsSaving(false);
    }
  };

  // Prompt Archive / Delete
  const promptArchive = (buyer) => {
    setConfirmTarget(buyer);
    setConfirmAction("archive");
    setIsConfirmOpen(true);
  };

  // Prompt Restore
  const promptRestore = (buyer) => {
    setConfirmTarget(buyer);
    setConfirmAction("restore");
    setIsConfirmOpen(true);
  };

  // Execute Archive / Restore
  const handleConfirmAction = async () => {
    if (!confirmTarget) return;
    setIsActionLoading(true);

    try {
      if (confirmAction === "archive") {
        const res = await fetch(`/api/employee/buyer?id=${confirmTarget._id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("Buyer archived successfully!");
          setIsConfirmOpen(false);
          fetchBuyers();
        } else {
          toast.error(data.error || "Failed to archive buyer");
        }
      } else if (confirmAction === "restore") {
        const res = await fetch("/api/employee/buyer", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: confirmTarget._id, action: "restore" }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("Buyer restored successfully!");
          setIsConfirmOpen(false);
          fetchBuyers();
        } else {
          toast.error(data.error || "Failed to restore buyer");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error performing action");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Overall Statistics Calculation
  const stats = useMemo(() => {
    const total = buyers.length;
    const invoicedBuyers = buyers.filter((b) => (b.invoiceCount || 0) > 0).length;
    const totalInvoices = buyers.reduce((acc, b) => acc + (b.invoiceCount || 0), 0);
    const totalRevenue = buyers.reduce((acc, b) => acc + (b.totalSpent || 0), 0);
    return {
      total,
      invoicedBuyers,
      totalInvoices,
      totalRevenue,
    };
  }, [buyers]);

  // Unique States present in the buyers list
  const availableStates = useMemo(() => {
    const set = new Set();
    buyers.forEach((b) => {
      if (b.state) set.add(b.state);
    });
    return Array.from(set).sort();
  }, [buyers]);

  // Filtered and Sorted Buyers
  const filteredBuyers = useMemo(() => {
    let result = [...buyers];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.businessName?.toLowerCase().includes(q) ||
          b.contactPerson?.toLowerCase().includes(q) ||
          b.phoneNo?.toLowerCase().includes(q) ||
          b.email?.toLowerCase().includes(q) ||
          b.gstNo?.toLowerCase().includes(q) ||
          b.address?.toLowerCase().includes(q) ||
          b.state?.toLowerCase().includes(q)
      );
    }

    // State filter
    if (selectedState !== "ALL") {
      result = result.filter((b) => b.state === selectedState);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name_asc") {
        return (a.businessName || "").localeCompare(b.businessName || "");
      }
      if (sortBy === "name_desc") {
        return (b.businessName || "").localeCompare(a.businessName || "");
      }
      if (sortBy === "invoices_desc") {
        return (b.invoiceCount || 0) - (a.invoiceCount || 0);
      }
      if (sortBy === "revenue_desc") {
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      }
      if (sortBy === "created_desc") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });

    return result;
  }, [buyers, search, selectedState, sortBy]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.titleIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className={styles.titleTextGroup}>
            <h1 className={styles.title}>
              All Buyers / Customers
              <span className={styles.countBadge}>{filteredBuyers.length}</span>
            </h1>
            <span className={styles.subtitle}>
              Manage individual B2B buyers, contact details, and invoice history
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchBuyers}
            disabled={refreshing}
            title="Refresh buyers list"
          >
            <RefreshIcon isSpinning={refreshing} size={15} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className={styles.addBtn}
            onClick={handleOpenAdd}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Buyer
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className={styles.statMeta}>
            <span className={styles.statLabel}>Total Buyers</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className={styles.statMeta}>
            <span className={styles.statLabel}>Invoiced Clients</span>
            <span className={styles.statValue}>{stats.invoicedBuyers}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(139, 92, 246, 0.15)", color: "#c4b5fd" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <div className={styles.statMeta}>
            <span className={styles.statLabel}>Invoices Generated</span>
            <span className={styles.statValue}>{stats.totalInvoices}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIconWrap}
            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className={styles.statMeta}>
            <span className={styles.statLabel}>Total B2B Revenue</span>
            <span className={styles.statValue} style={{ color: "#34d399" }}>
              {formatINR(stats.totalRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search buyer name, contact, phone, GSTIN, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearch("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.filterControls}>
          {/* State Filter */}
          <select
            className={styles.selectInput}
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            <option value="ALL">All States ({availableStates.length})</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            className={styles.selectInput}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
            <option value="invoices_desc">Most Invoices</option>
            <option value="revenue_desc">Highest Spend</option>
            <option value="created_desc">Recently Added</option>
          </select>

          {/* View Toggle */}
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid Cards View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${viewMode === "table" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Archived Toggle */}
          <label className={styles.archiveCheckboxLabel}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            <span>Show Archived</span>
          </label>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className={styles.emptyState}>
          <div className={styles.spinner}></div>
          <span>Loading buyers list...</span>
        </div>
      ) : filteredBuyers.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
          <div className={styles.emptyStateTitle}>No buyers found</div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
            {search
              ? "Try adjusting your search query or state filter."
              : "Click 'Add New Buyer' to create your first customer profile."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div className={styles.buyerGrid}>
          {filteredBuyers.map((buyer) => (
            <div
              key={buyer._id}
              className={`${styles.buyerCard} ${buyer.isArchived ? styles.buyerCardArchived : ""}`}
            >
              <div>
                {/* Header */}
                <div className={styles.cardHeader}>
                  <Avatar name={buyer.businessName} />
                  <div className={styles.cardHeaderContent}>
                    <h3 className={styles.buyerName} title={buyer.businessName}>
                      {buyer.businessName}
                    </h3>
                    <div className={styles.badgeRow}>
                      {buyer.gstNo && buyer.gstNo !== "NA" && buyer.gstNo !== "N/A" ? (
                        <span className={styles.gstBadge} title={`GSTIN: ${buyer.gstNo}`}>
                          GST: {buyer.gstNo}
                        </span>
                      ) : (
                        <span className={styles.noGstBadge}>Non-GST</span>
                      )}
                      {buyer.isArchived && (
                        <span className={styles.archivedBadge}>Archived</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className={styles.cardBody} style={{ marginTop: 12 }}>
                  {buyer.contactPerson && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </span>
                      <span className={styles.detailText}>{buyer.contactPerson}</span>
                    </div>
                  )}

                  {buyer.phoneNo && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </span>
                      <span className={styles.detailText}>{buyer.phoneNo}</span>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard(buyer.phoneNo, "Phone")}
                        title="Copy phone"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  )}

                  {buyer.email && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </span>
                      <span className={styles.detailText}>{buyer.email}</span>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard(buyer.email, "Email")}
                        title="Copy email"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className={styles.detailRow}>
                    <span className={styles.detailIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </span>
                    <span className={styles.detailText} title={buyer.address || buyer.state}>
                      {buyer.address ? `${buyer.address}, ` : ""}
                      <strong style={{ color: "#f8fafc" }}>{buyer.state}</strong>
                      {buyer.pinCode ? ` - ${buyer.pinCode}` : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Box */}
              <div>
                <div className={styles.cardFinancials}>
                  <div className={styles.financeItem}>
                    <span className={styles.financeLabel}>Invoices</span>
                    <span className={styles.financeVal}>{buyer.invoiceCount || 0}</span>
                  </div>
                  <div className={styles.financeItem} style={{ textAlign: "right" }}>
                    <span className={styles.financeLabel}>Total Spend</span>
                    <span className={`${styles.financeVal} ${styles.financeValHighlight}`}>
                      {formatINR(buyer.totalSpent || 0)}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className={styles.cardFooter}>
                  <Link
                    href={`/create-b2b-invoice?buyerId=${buyer._id}`}
                    className={styles.createInvoiceBtn}
                    title="Generate B2B invoice for this buyer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    Create Invoice
                  </Link>

                  <button
                    type="button"
                    className={styles.iconActionBtn}
                    onClick={() => setViewingBuyer(buyer)}
                    title="View Buyer Details"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>

                  <button
                    type="button"
                    className={styles.iconActionBtn}
                    onClick={() => handleOpenEdit(buyer)}
                    title="Edit Buyer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>

                  {buyer.isArchived ? (
                    <button
                      type="button"
                      className={styles.iconActionBtn}
                      onClick={() => promptRestore(buyer)}
                      title="Restore Buyer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.iconActionBtn} ${styles.iconActionBtnDanger}`}
                      onClick={() => promptArchive(buyer)}
                      title="Archive Buyer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Buyer Name</th>
                <th className={styles.th}>Contact Person</th>
                <th className={styles.th}>Phone / Email</th>
                <th className={styles.th}>State / Address</th>
                <th className={styles.th}>GSTIN</th>
                <th className={styles.th}>Invoices</th>
                <th className={styles.th}>Total Spend</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuyers.map((buyer) => (
                <tr key={buyer._id} className={styles.tr}>
                  <td className={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={buyer.businessName} />
                      <div>
                        <div style={{ fontWeight: 600, color: "#f8fafc" }}>
                          {buyer.businessName}
                        </div>
                        {buyer.isArchived && (
                          <span className={styles.archivedBadge}>Archived</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    {buyer.contactPerson || <span style={{ color: "#64748b" }}>—</span>}
                  </td>
                  <td className={styles.td}>
                    <div>{buyer.phoneNo || "—"}</div>
                    {buyer.email && (
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {buyer.email}
                      </div>
                    )}
                  </td>
                  <td className={styles.td}>
                    <div style={{ fontWeight: 500 }}>{buyer.state}</div>
                    {buyer.address && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {buyer.address}
                      </div>
                    )}
                  </td>
                  <td className={styles.td}>
                    {buyer.gstNo && buyer.gstNo !== "NA" && buyer.gstNo !== "N/A" ? (
                      <span className={styles.gstBadge}>{buyer.gstNo}</span>
                    ) : (
                      <span className={styles.noGstBadge}>Non-GST</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <strong>{buyer.invoiceCount || 0}</strong>
                  </td>
                  <td className={styles.td}>
                    <strong style={{ color: "#34d399" }}>
                      {formatINR(buyer.totalSpent || 0)}
                    </strong>
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <Link
                        href={`/create-b2b-invoice?buyerId=${buyer._id}`}
                        className={styles.createInvoiceBtn}
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        title="Create Invoice"
                      >
                        Invoice
                      </Link>
                      <button
                        type="button"
                        className={styles.iconActionBtn}
                        onClick={() => setViewingBuyer(buyer)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        type="button"
                        className={styles.iconActionBtn}
                        onClick={() => handleOpenEdit(buyer)}
                        title="Edit Buyer"
                      >
                        ✏️
                      </button>
                      {buyer.isArchived ? (
                        <button
                          type="button"
                          className={styles.iconActionBtn}
                          onClick={() => promptRestore(buyer)}
                          title="Restore Buyer"
                        >
                          🔄
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.iconActionBtn} ${styles.iconActionBtnDanger}`}
                          onClick={() => promptArchive(buyer)}
                          title="Archive Buyer"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Buyer Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingBuyer ? "Edit Buyer Details" : "Add New Buyer / Customer"}
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => !isSaving && setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBuyer}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Buyer / Company Name *</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Acme Enterprises / Rahul Sharma"
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData({ ...formData, businessName: e.target.value })
                      }
                      required
                      autoFocus
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Contact Person</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. John Doe"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPerson: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Contact Phone / Mobile</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. +91 9876543210"
                      value={formData.phoneNo}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNo: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Email Address</label>
                    <input
                      type="email"
                      className={styles.input}
                      placeholder="buyer@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>GSTIN Number</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. 19ABCDE1234F1Z5 or NA"
                      value={formData.gstNo}
                      onChange={(e) =>
                        setFormData({ ...formData, gstNo: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>State *</label>
                    <select
                      className={styles.select}
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
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
                    <label className={styles.label}>PIN Code</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. 700090"
                      value={formData.pinCode}
                      onChange={(e) =>
                        setFormData({ ...formData, pinCode: e.target.value })
                      }
                    />
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Full Address</label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Enter street, shop, locality, city..."
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows={2}
                    />
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Internal Notes / Remarks</label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Special instructions or notes for this buyer..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingBuyer
                    ? "Update Buyer"
                    : "Save Buyer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Buyer Details Modal */}
      {viewingBuyer && (
        <div className={styles.modalOverlay} onClick={() => setViewingBuyer(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Buyer Profile</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setViewingBuyer(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.profileHeader}>
                <div
                  className={styles.profileAvatar}
                  style={{
                    background: `hsl(${
                      [...viewingBuyer.businessName].reduce(
                        (acc, c) => acc + c.charCodeAt(0),
                        0
                      ) % 360
                    }, 65%, 38%)`,
                  }}
                >
                  {viewingBuyer.businessName.slice(0, 2).toUpperCase()}
                </div>
                <div className={styles.profileInfo}>
                  <h3 className={styles.profileName}>{viewingBuyer.businessName}</h3>
                  <div className={styles.badgeRow}>
                    {viewingBuyer.gstNo &&
                    viewingBuyer.gstNo !== "NA" &&
                    viewingBuyer.gstNo !== "N/A" ? (
                      <span className={styles.gstBadge}>
                        GSTIN: {viewingBuyer.gstNo}
                      </span>
                    ) : (
                      <span className={styles.noGstBadge}>Unregistered (No GST)</span>
                    )}
                    {viewingBuyer.isArchived && (
                      <span className={styles.archivedBadge}>Archived</span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.profileStats}>
                <div className={styles.financeItem}>
                  <span className={styles.financeLabel}>Total Invoices</span>
                  <span className={styles.statValue} style={{ fontSize: "1.2rem" }}>
                    {viewingBuyer.invoiceCount || 0}
                  </span>
                </div>
                <div className={styles.financeItem}>
                  <span className={styles.financeLabel}>Total Invoiced Value</span>
                  <span
                    className={styles.statValue}
                    style={{ fontSize: "1.2rem", color: "#34d399" }}
                  >
                    {formatINR(viewingBuyer.totalSpent || 0)}
                  </span>
                </div>
              </div>

              <div className={styles.profileDetailList}>
                <div className={styles.profileDetailItem}>
                  <span className={styles.profileDetailLabel}>Contact Person</span>
                  <span className={styles.profileDetailVal}>
                    {viewingBuyer.contactPerson || "Not specified"}
                  </span>
                </div>

                <div className={styles.profileDetailItem}>
                  <span className={styles.profileDetailLabel}>Phone Number</span>
                  <span className={styles.profileDetailVal}>
                    {viewingBuyer.phoneNo || "Not specified"}
                  </span>
                </div>

                <div className={styles.profileDetailItem}>
                  <span className={styles.profileDetailLabel}>Email Address</span>
                  <span className={styles.profileDetailVal}>
                    {viewingBuyer.email || "Not specified"}
                  </span>
                </div>

                <div className={styles.profileDetailItem}>
                  <span className={styles.profileDetailLabel}>State</span>
                  <span className={styles.profileDetailVal}>
                    {viewingBuyer.state || "19-West Bengal"}
                  </span>
                </div>

                <div className={styles.profileDetailItem}>
                  <span className={styles.profileDetailLabel}>Full Address</span>
                  <span className={styles.profileDetailVal}>
                    {viewingBuyer.address || "Not specified"}
                    {viewingBuyer.pinCode ? ` (PIN: ${viewingBuyer.pinCode})` : ""}
                  </span>
                </div>

                {viewingBuyer.notes && (
                  <div className={styles.profileDetailItem} style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                    <span className={styles.profileDetailLabel}>Internal Notes</span>
                    <span style={{ fontSize: "0.85rem", color: "#cbd5e1", whiteSpace: "pre-wrap" }}>
                      {viewingBuyer.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Link
                href={`/create-b2b-invoice?buyerId=${viewingBuyer._id}`}
                className={styles.createInvoiceBtn}
                style={{ flex: "none", padding: "0.55rem 1.15rem" }}
              >
                Create New Invoice
              </Link>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setViewingBuyer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmAction === "archive" ? "Archive Buyer" : "Restore Buyer"}
        message={
          confirmAction === "archive"
            ? `Are you sure you want to archive "${confirmTarget?.businessName}"? This buyer will be hidden from the default list.`
            : `Are you sure you want to restore "${confirmTarget?.businessName}"?`
        }
        confirmLabel={confirmAction === "archive" ? "Yes, Archive" : "Yes, Restore"}
        variant={confirmAction === "archive" ? "danger" : "info"}
        isLoading={isActionLoading}
        onConfirm={handleConfirmAction}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
