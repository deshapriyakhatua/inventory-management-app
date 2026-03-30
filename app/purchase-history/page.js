"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

export default function PurchaseHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  
  // Filtering & Pagination & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Delivered, In-Transit
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [sortConfig, setSortConfig] = useState({ key: "orderedOn", direction: "desc" });

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/purchase?history=true");
      const result = await res.json();
      if (res.ok && result.success) {
        setPurchases(result.purchases || []);
      } else {
        setMsg({ text: result.error || "Failed to load purchase history", type: "error" });
      }
    } catch (error) {
      setMsg({ text: "Network error loading history", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (p) => {
    const subtotal = p.quantity * p.price;
    const taxAmount = (subtotal * (p.taxPercentage || 0)) / 100;
    return subtotal + (p.shippingFee || 0) + taxAmount;
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const processedPurchases = useMemo(() => {
    let filtered = purchases;

    // 1. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.inventoryId?.toLowerCase().includes(q) || 
        p.invoiceNo?.toLowerCase().includes(q) ||
        p.sellerId?.businessName?.toLowerCase().includes(q) ||
        p.sellerProductId?.toLowerCase().includes(q)
      );
    }

    // 2. Filter by Status
    if (statusFilter !== "All") {
      filtered = filtered.filter(p => {
        const isDelivered = !!p.receivedOn;
        if (statusFilter === "Delivered") return isDelivered;
        if (statusFilter === "In-Transit") return !isDelivered;
        return true;
      });
    }

    // 3. Sort
    filtered = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "sellerId") {
        aValue = a.sellerId?.businessName || "";
        bValue = b.sellerId?.businessName || "";
      } else if (sortConfig.key === "total") {
        aValue = calculateTotal(a);
        bValue = calculateTotal(b);
      }

      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [purchases, searchQuery, statusFilter, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(processedPurchases.length / itemsPerPage);
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedPurchases.slice(start, start + itemsPerPage);
  }, [processedPurchases, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
  }, [searchQuery, statusFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const toInputDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split('T')[0];
  };

  const openEditModal = (p) => {
    setEditingData({
      _id: p._id,
      quantity: p.quantity,
      price: p.price,
      shippingFee: p.shippingFee || 0,
      taxPercentage: p.taxPercentage || 0,
      invoiceNo: p.invoiceNo || "",
      orderedOn: toInputDate(p.orderedOn),
      receivedOn: toInputDate(p.receivedOn),
    });
    setIsEditing(true);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setEditingData(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingData(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      const payload = { ...editingData };
      if (!payload.receivedOn) payload.receivedOn = null; // Send null to indicate in-transit

      const res = await fetch("/api/employee/purchase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setPurchases(purchases.map(p => p._id === result.data._id ? result.data : p));
        setMsg({ text: "Purchase updated successfully!", type: "success" });
        closeEditModal();
      } else {
        setMsg({ text: result.error || "Failed to update purchase", type: "error" });
      }
    } catch (error) {
      setMsg({ text: "Network error saving purchase", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className={styles.sortPlaceholder}>↕</span>;
    return <span className={styles.sortActive}>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Purchase History</h1>
          <p className={styles.subtitle}>A complete log of all inbound stock and procurement expenses.</p>
        </div>
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search by SKU, Invoice, ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className={styles.filterSelect} 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Delivered">Delivered</option>
            <option value="In-Transit">In-Transit</option>
          </select>
          <button className={styles.refreshBtn} onClick={fetchPurchases} title="Refresh Data">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("orderedOn")}>Date Ordered <SortIcon columnKey="orderedOn" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("sellerId")}>Seller <SortIcon columnKey="sellerId" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("sellerProductId")}>Seller SKU <SortIcon columnKey="sellerProductId" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("inventoryId")}>Internal ID <SortIcon columnKey="inventoryId" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("quantity")}>Qty <SortIcon columnKey="quantity" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("price")}>Unit Price <SortIcon columnKey="price" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("total")}>Total <SortIcon columnKey="total" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("invoiceNo")}>Invoice No <SortIcon columnKey="invoiceNo" /></th>
                <th className={`${styles.th} ${styles.sortable}`} onClick={() => handleSort("receivedOn")}>Received On <SortIcon columnKey="receivedOn" /></th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className={styles.td}>
                    <div className={styles.loadingWrapper}>
                      <div className={styles.spinner}></div>
                      <p>Fetching history logs...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan="11" className={styles.noData}>
                    No purchase records found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((p) => (
                  <tr key={p._id} className={styles.tr}>
                    <td className={styles.td}>{formatDate(p.orderedOn)}</td>
                    <td className={`${styles.td} ${styles.sellerCell}`}>{p.sellerId?.businessName || "Unknown"}</td>
                    <td className={styles.td}>{p.sellerProductId}</td>
                    <td className={`${styles.td} ${styles.idCell}`}>{p.inventoryId}</td>
                    <td className={`${styles.td} ${styles.quantity}`}>{p.quantity}</td>
                    <td className={`${styles.td} ${styles.price}`}>₹{p.price.toFixed(2)}</td>
                    <td className={`${styles.td} ${styles.total}`}>₹{calculateTotal(p).toFixed(2)}</td>
                    <td className={styles.td}>{p.invoiceNo || "-"}</td>
                    <td className={styles.td}>{formatDate(p.receivedOn)}</td>
                    <td className={styles.td}>
                      <span className={`${styles.status} ${p.receivedOn ? styles.received : styles.pending}`}>
                        <span className={styles.dot}></span>
                        {p.receivedOn ? "Delivered" : "In-Transit"}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <button className={styles.editBtn} onClick={() => openEditModal(p)}>Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Prev
            </button>
            <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isEditing && editingData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Edit Purchase</h2>
            <div className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Date Ordered</label>
                <input type="date" name="orderedOn" value={editingData.orderedOn} onChange={handleEditChange} required />
              </div>
              <div className={styles.rowGroup}>
                <div className={styles.formGroup}>
                  <label>Quantity</label>
                  <input type="number" name="quantity" value={editingData.quantity} onChange={handleEditChange} min="1" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Unit Price</label>
                  <input type="number" name="price" value={editingData.price} onChange={handleEditChange} step="0.01" min="0" required />
                </div>
              </div>
              <div className={styles.rowGroup}>
                <div className={styles.formGroup}>
                  <label>Shipping Fee</label>
                  <input type="number" name="shippingFee" value={editingData.shippingFee} onChange={handleEditChange} step="0.01" min="0" />
                </div>
                <div className={styles.formGroup}>
                  <label>Tax (%)</label>
                  <input type="number" name="taxPercentage" value={editingData.taxPercentage} onChange={handleEditChange} step="0.1" min="0" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Invoice No</label>
                <input type="text" name="invoiceNo" value={editingData.invoiceNo} onChange={handleEditChange} placeholder="Enter Invoice No" />
              </div>
              <div className={styles.formGroup}>
                <label>Received On (Leave blank if In-Transit)</label>
                <input type="date" name="receivedOn" value={editingData.receivedOn} onChange={handleEditChange} />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeEditModal} disabled={isSaving}>Cancel</button>
              <button className={styles.saveBtn} onClick={saveEdit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={message} onClose={() => setMsg({ text: "", type: "" })} />
    </div>
  );
}
