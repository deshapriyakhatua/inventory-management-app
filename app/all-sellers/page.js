"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";
import { useAuth } from "../../components/AuthProvider";

/* ── Helper ──────────────────────────────────────────── */
function copy(text, setMsg) {
  navigator.clipboard.writeText(text).then(
    () => setMsg({ text: `Copied!`, type: "success" }),
    () => setMsg({ text: "Failed to copy", type: "error" })
  );
}

function Avatar({ name }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={styles.avatar}
      style={{ background: `hsl(${hue}, 55%, 35%)` }}
      aria-hidden="true"
    >
      {initials || "?"}
    </div>
  );
}

/* ── Detail Row ──────────────────────────────────────── */
function DetailRow({ icon, label, value, onCopy }) {
  if (!value) return null;
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon}>{icon}</span>
      <div className={styles.detailContent}>
        <span className={styles.detailLabel}>{label}</span>
        <span className={styles.detailValue}>{value}</span>
      </div>
      {onCopy && (
        <button className={styles.copyIconBtn} onClick={onCopy} title="Copy">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────── */
export default function AllSellersPage() {
  const { user } = useAuth();
  
  const [allSellers, setAllSellers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [message, setMsg] = useState({ text: "", type: "" });

  // View States
  const [showArchived, setShowArchived] = useState(false);

  // Modal states
  const [selectedSeller, setSelectedSeller] = useState(null);
  
  // Delete / Archive states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Restore states
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [sellerToRestore, setSellerToRestore] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  /* ── Fetch ── */
  const fetchSellers = async (force = false, fetchArchived = showArchived) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const url = `/api/employee/seller${fetchArchived ? "?showArchived=true" : ""}`;
      const res = await fetch(url);
      const result = await res.json();
      if (res.ok && result.success) {
        setAllSellers(result.data || []);
      } else {
        setMsg({ text: result.error || "Failed to load sellers.", type: "error" });
      }
    } catch {
      setMsg({ text: "Network error while loading sellers.", type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSellers(); }, []);

  /* ── Local filter + paginate ── */
  useEffect(() => {
    let filtered = [...allSellers];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.businessName?.toLowerCase().includes(q) ||
          s.contactPerson?.toLowerCase().includes(q) ||
          s.gstNo?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.phoneNo?.toLowerCase().includes(q)
      );
    }
    setTotalItems(filtered.length);
    const start = (currentPage - 1) * pageSize;
    setSellers(filtered.slice(start, start + pageSize));
  }, [allSellers, searchQuery, currentPage, pageSize]);

  /* ── Archive ── */
  const confirmDelete = async () => {
    if (!sellerToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/employee/seller?id=${sellerToDelete}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok && result.success) {
        setMsg({ text: "Seller archived successfully.", type: "success" });
        // Update local state
        setAllSellers((prev) => 
          showArchived 
            ? prev.map((s) => s._id === sellerToDelete ? { ...s, isArchived: true } : s)
            : prev.filter((s) => s._id !== sellerToDelete)
        );
        if (selectedSeller?._id === sellerToDelete) setSelectedSeller(null);
      } else {
        setMsg({ text: result.error || "Failed to archive seller.", type: "error" });
      }
    } catch {
      setMsg({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setSellerToDelete(null);
    }
  };

  /* ── Restore ── */
  const confirmRestore = async () => {
    if (!sellerToRestore) return;
    setRestoreLoading(true);
    try {
      const res = await fetch(`/api/employee/seller`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sellerToRestore, action: "restore" }) 
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMsg({ text: "Seller restored successfully.", type: "success" });
        // If we want them to disappear from the 'Archived' list, we can remove them.
        // Wait, if we are viewing 'Archived', restoring should perhaps keep it or remove it?
        // Let's remove it because it's no longer archived.
        setAllSellers((prev) => prev.filter((s) => s._id !== sellerToRestore));
        if (selectedSeller?._id === sellerToRestore) setSelectedSeller(null);
      } else {
        setMsg({ text: result.error || "Failed to restore seller.", type: "error" });
      }
    } catch {
      setMsg({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setRestoreLoading(false);
      setShowRestoreConfirm(false);
      setSellerToRestore(null);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  /* ── Icons ── */
  const iconPhone = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" /></svg>;
  const iconMail = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
  const iconMap = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
  const iconBank = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
  const iconShip = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
  const iconGst = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>All Sellers</h1>
          <span className={styles.countBadge}>{totalItems}</span>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, GST, phone, email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.clearSearch} onClick={() => { setSearchQuery(""); setCurrentPage(1); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <button
            className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ""}`}
            onClick={() => fetchSellers(true)}
            disabled={refreshing}
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>

          {/* Admin Toggle For Archived */}
          {(user?.role === "admin" || user?.role === "superadmin") && (
            <button
              className={styles.refreshBtn}
              onClick={() => {
                const newVal = !showArchived;
                setShowArchived(newVal);
                setCurrentPage(1);
                fetchSellers(true, newVal);
              }}
              title={showArchived ? "Hide Archived" : "Show Archived"}
              style={showArchived ? { backgroundColor: "#3b82f6", color: "white", borderColor: "#3b82f6" } : {}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8v13H3V8"></path>
                <polyline points="1 3 23 3 23 8 1 8 1 3"></polyline>
                <path d="M10 12h4"></path>
              </svg>
              {showArchived ? "Hide Archived" : "Show Archived"}
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={styles.emptyState}>
          <div className={styles.spinner} />
          <p>Loading sellers...</p>
        </div>
      ) : sellers.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
          <p>{searchQuery ? "No sellers match your search." : "No sellers found. Add one to get started."}</p>
        </div>
      ) : (
        <div className={styles.contentArea}>
          <div className={styles.scrollWrapper}>
            <div className={styles.grid}>
              {sellers.map((seller) => (
                <div key={seller._id} className={styles.card} onClick={() => setSelectedSeller(seller)}>
                  {/* Delete or Restore button */}
                  {(user?.role === "admin" || user?.role === "superadmin") && seller.isArchived ? (
                    <button
                      className={styles.deleteCardBtn}
                      onClick={(e) => { e.stopPropagation(); setSellerToRestore(seller._id); setShowRestoreConfirm(true); }}
                      title="Restore Seller"
                      style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 14 4 9 9 4"></polyline>
                        <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                      </svg>
                    </button>
                  ) : (
                    !seller.isArchived && (
                      <button
                        className={styles.deleteCardBtn}
                        onClick={(e) => { e.stopPropagation(); setSellerToDelete(seller._id); setShowDeleteConfirm(true); }}
                        title="Archive Seller"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )
                  )}

                  <div className={styles.cardTop}>
                    <Avatar name={seller.businessName} />
                    <div className={styles.cardMeta}>
                      <p className={styles.cardName}>
                        {seller.businessName}
                        {seller.isArchived && (
                          <span style={{ marginLeft: "8px", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", textTransform: "uppercase" }}>Archived</span>
                        )}
                      </p>
                      {seller.contactPerson && <p className={styles.cardPerson}>{seller.contactPerson}</p>}
                    </div>
                  </div>

                  <div className={styles.cardDetails}>
                    {seller.phoneNo && (
                      <div className={styles.cardRow}>
                        {iconPhone}
                        <span>{seller.phoneNo}</span>
                      </div>
                    )}
                    {seller.email && (
                      <div className={styles.cardRow}>
                        {iconMail}
                        <span className={styles.truncate}>{seller.email}</span>
                      </div>
                    )}
                    {seller.gstNo && (
                      <div className={styles.cardRow}>
                        {iconGst}
                        <span className={styles.gstTag}>{seller.gstNo}</span>
                      </div>
                    )}
                    {(seller.state || seller.country) && (
                      <div className={styles.cardRow}>
                        {iconMap}
                        <span>{[seller.state, seller.country].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    {seller.shippingProvider && (
                      <span className={styles.shipBadge}>
                        {iconShip} {seller.shippingProvider}
                      </span>
                    )}
                    <span className={styles.addedDate}>
                      {new Date(seller.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pagination ── */}
          {totalItems > pageSize && (
            <div className={styles.pagination}>
              <div className={styles.paginationLeft}>
                <span className={styles.pageInfo}>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                </span>
                <div className={styles.pageSizeWrapper}>
                  <label htmlFor="pageSizeSelect" className={styles.pageSizeLabel}>Per page:</label>
                  <select
                    id="pageSizeSelect"
                    className={styles.pageSizeSelect}
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  >
                    {[20, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.pageControls}>
                <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>
                <span className={styles.pageDisplay}>Page {currentPage} of {totalPages}</span>
                <button className={styles.pageBtn} disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedSeller && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSeller(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedSeller(null)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className={styles.modalScroll}>
              {/* Modal header */}
              <div className={styles.modalHeader}>
                <Avatar name={selectedSeller.businessName} />
                <div>
                  <h2 className={styles.modalTitle}>
                    {selectedSeller.businessName}
                    {selectedSeller.isArchived && (
                      <span style={{ marginLeft: "10px", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", textTransform: "uppercase", verticalAlign: "middle" }}>Archived</span>
                    )}
                  </h2>
                  {selectedSeller.contactPerson && <p className={styles.modalSubtitle}>{selectedSeller.contactPerson}</p>}
                  <p className={styles.modalMeta}>
                    Added {new Date(selectedSeller.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className={styles.modalSections}>

                {/* Basic Info */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Business Info</h3>
                  <DetailRow icon={iconGst} label="GST No" value={selectedSeller.gstNo} onCopy={() => copy(selectedSeller.gstNo, setMsg)} />
                  <DetailRow icon={iconMail} label="Email" value={selectedSeller.email} onCopy={() => copy(selectedSeller.email, setMsg)} />
                  <DetailRow icon={iconShip} label="Shipping Provider" value={selectedSeller.shippingProvider} />
                </div>

                {/* Contact */}
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Contact Numbers</h3>
                  <DetailRow icon={iconPhone} label="Phone" value={selectedSeller.phoneNo} onCopy={() => copy(selectedSeller.phoneNo, setMsg)} />
                  <DetailRow icon={iconPhone} label="WhatsApp" value={selectedSeller.whatsAppNo} onCopy={() => copy(selectedSeller.whatsAppNo, setMsg)} />
                  <DetailRow icon={iconPhone} label="Alt Phone" value={selectedSeller.altPhoneNo} onCopy={() => copy(selectedSeller.altPhoneNo, setMsg)} />
                  <DetailRow icon={iconPhone} label="Alt WhatsApp" value={selectedSeller.altWhatsAppNo} onCopy={() => copy(selectedSeller.altWhatsAppNo, setMsg)} />
                </div>

                {/* Address */}
                {(selectedSeller.address || selectedSeller.state || selectedSeller.country || selectedSeller.pinCode) && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>Address</h3>
                    <DetailRow icon={iconMap} label="Address" value={selectedSeller.address} />
                    <DetailRow icon={iconMap} label="State" value={selectedSeller.state} />
                    <DetailRow icon={iconMap} label="Country" value={selectedSeller.country} />
                    <DetailRow icon={iconMap} label="Pin Code" value={selectedSeller.pinCode} />
                  </div>
                )}

                {/* Primary Bank */}
                {(selectedSeller.bankName || selectedSeller.accountNo || selectedSeller.upiId) && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>Primary Bank</h3>
                    <DetailRow icon={iconBank} label="Bank" value={selectedSeller.bankName} />
                    <DetailRow icon={iconBank} label="Account No" value={selectedSeller.accountNo} onCopy={() => copy(selectedSeller.accountNo, setMsg)} />
                    <DetailRow icon={iconBank} label="IFSC" value={selectedSeller.ifscCode} onCopy={() => copy(selectedSeller.ifscCode, setMsg)} />
                    <DetailRow icon={iconBank} label="Branch" value={selectedSeller.branch} />
                    <DetailRow icon={iconBank} label="Account Type" value={selectedSeller.accountType} />
                    <DetailRow icon={iconBank} label="UPI ID" value={selectedSeller.upiId} onCopy={() => copy(selectedSeller.upiId, setMsg)} />
                  </div>
                )}

                {/* Alternate Bank */}
                {(selectedSeller.altBankName || selectedSeller.altAccountNo || selectedSeller.altUpiId) && (
                  <div className={styles.modalSection}>
                    <h3 className={styles.modalSectionTitle}>Alternate Bank</h3>
                    <DetailRow icon={iconBank} label="Bank" value={selectedSeller.altBankName} />
                    <DetailRow icon={iconBank} label="Account No" value={selectedSeller.altAccountNo} onCopy={() => copy(selectedSeller.altAccountNo, setMsg)} />
                    <DetailRow icon={iconBank} label="IFSC" value={selectedSeller.altIfscCode} onCopy={() => copy(selectedSeller.altIfscCode, setMsg)} />
                    <DetailRow icon={iconBank} label="Branch" value={selectedSeller.altBranch} />
                    <DetailRow icon={iconBank} label="Account Type" value={selectedSeller.altAccountType} />
                    <DetailRow icon={iconBank} label="UPI ID" value={selectedSeller.altUpiId} onCopy={() => copy(selectedSeller.altUpiId, setMsg)} />
                  </div>
                )}
              </div>

              {/* Modal actions */}
              <div className={styles.modalActions}>
                {selectedSeller.isArchived && (user?.role === "admin" || user?.role === "superadmin") ? (
                  <button
                    className={styles.modalRestoreBtn}
                    onClick={() => { setSellerToRestore(selectedSeller._id); setShowRestoreConfirm(true); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                    </svg>
                    Restore Seller
                  </button>
                ) : (
                  !selectedSeller.isArchived && (
                    <button
                      className={styles.modalDeleteBtn}
                      onClick={() => { setSellerToDelete(selectedSeller._id); setShowDeleteConfirm(true); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Archive Seller
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive Confirm ── */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => { setShowDeleteConfirm(false); setSellerToDelete(null); }}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className={styles.confirmTitle}>Archive Seller?</h3>
            <p className={styles.confirmMsg}>Are you sure you want to archive this seller? They will be hidden from the active list.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => { setShowDeleteConfirm(false); setSellerToDelete(null); }} disabled={deleteLoading}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? "Archiving..." : "Confirm Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Restore Confirm ── */}
      {showRestoreConfirm && (
        <div className={styles.confirmOverlay} onClick={() => { setShowRestoreConfirm(false); setSellerToRestore(null); }}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon} style={{ background: "rgba(16, 185, 129, 0.1)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4"></polyline>
                <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
              </svg>
            </div>
            <h3 className={styles.confirmTitle}>Restore Seller?</h3>
            <p className={styles.confirmMsg}>Are you sure you want to restore this seller? They will become active again.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => { setShowRestoreConfirm(false); setSellerToRestore(null); }} disabled={restoreLoading}>Cancel</button>
              <button className={styles.confirmRestoreBtn} onClick={confirmRestore} disabled={restoreLoading}>
                {restoreLoading ? "Restoring..." : "Confirm Restore"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={message} onClose={() => setMsg({ text: "", type: "" })} />
    </div>
  );
}
