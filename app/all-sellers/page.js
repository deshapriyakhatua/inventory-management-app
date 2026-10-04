"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";


import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

import { useAuth } from "../../components/AuthProvider";
import { parseSearchQuery, matchesArraySearchTerms } from "../../utils/searchUtils";

/* ── Helper ──────────────────────────────────────────── */
function copy(text, setMsg) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`Copied!`, { id: "app-feedback", duration: 3000 }),
    () => toast.error("Failed to copy", { id: "app-feedback", duration: 3000 })
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
          <Icon name="copy-inventory-id" size={13} />
        </button>
      )}
    </div>
  );
}

/* ── Form Helpers ────────────────────────────────────── */
function Field({ label, name, type = "text", placeholder = "", value, onChange, disabled }) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={name} className={styles.label}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder || label}
        className={styles.input}
        disabled={disabled}
      />
    </div>
  );
}

function TextArea({ label, name, placeholder = "", value, onChange, disabled }) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={name} className={styles.label}>{label}</label>
      <textarea
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder || label}
        className={styles.textarea}
        disabled={disabled}
        rows={3}
      />
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

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

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
        toast.error(result.error || "Failed to load sellers.", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error while loading sellers.", { id: "app-feedback", duration: 3000 });
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
      const { includeTerms, excludeTerms } = parseSearchQuery(searchQuery);
      filtered = filtered.filter((s) => {
        const fields = [s.businessName, s.contactPerson, s.gstNo, s.email, s.phoneNo].filter(Boolean);
        return matchesArraySearchTerms(fields, includeTerms, excludeTerms);
      });
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
        toast.success("Seller archived successfully.", { id: "app-feedback", duration: 3000 });
        // Update local state
        setAllSellers((prev) => 
          showArchived 
            ? prev.map((s) => s._id === sellerToDelete ? { ...s, isArchived: true } : s)
            : prev.filter((s) => s._id !== sellerToDelete)
        );
        if (selectedSeller?._id === sellerToDelete) setSelectedSeller(null);
      } else {
        toast.error(result.error || "Failed to archive seller.", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
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
        toast.success("Seller restored successfully.", { id: "app-feedback", duration: 3000 });
        // If we want them to disappear from the 'Archived' list, we can remove them.
        // Wait, if we are viewing 'Archived', restoring should perhaps keep it or remove it?
        // Let's remove it because it's no longer archived.
        setAllSellers((prev) => prev.filter((s) => s._id !== sellerToRestore));
        if (selectedSeller?._id === sellerToRestore) setSelectedSeller(null);
      } else {
        toast.error(result.error || "Failed to restore seller.", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
    } finally {
      setRestoreLoading(false);
      setShowRestoreConfirm(false);
      setSellerToRestore(null);
    }
  };

  /* ── Edit ── */
  const handleEditChange = (e) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.businessName?.trim()) {
      toast.error("Business Name is required.", { id: "app-feedback", duration: 3000 });
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch("/api/employee/seller", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Seller updated successfully.", { id: "app-feedback", duration: 3000 });
        // Update local arrays
        setAllSellers(prev => prev.map(s => s._id === editFormData._id ? result.data : s));
        if (selectedSeller?._id === editFormData._id) {
          setSelectedSeller(result.data);
        }
        setShowEditModal(false);
      } else {
        toast.error(result.error || "Failed to update seller.", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error while updating seller.", { id: "app-feedback", duration: 3000 });
    } finally {
      setEditLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  /* ── Icons ── */
  const iconPhone = <Icon name="icon-2d625620" size={14} />;
  const iconMail = <Icon name="icon-4d0b16f6" size={14} />;
  const iconMap = <Icon name="icon-28f62de3" size={14} />;
  const iconBank = <Icon name="icon-208b8f70" size={14} />;
  const iconShip = <Icon name="icon-d4e3f44f" size={14} />;
  const iconGst = <Icon name="pdf-preview" size={14} />;

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
            <Icon name="icon-9c4a10ac" size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, GST, phone, email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.clearSearch} onClick={() => { setSearchQuery(""); setCurrentPage(1); }}>
                <Icon name="remove-this-product" size={14} />
              </button>
            )}
          </div>

          <button
            className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ""}`}
            onClick={() => fetchSellers(true)}
            disabled={refreshing}
            title="Refresh"
          >
            <Icon name="refresh" size={16} />
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
              <Icon name="icon-fb9fc010" size={16} />
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
          <Icon name="icon-d5851a0c" size={48} />
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
                      <Icon name="restore-inventory" size={14} />
                    </button>
                  ) : (
                    !seller.isArchived && (
                      <button
                        className={styles.deleteCardBtn}
                        onClick={(e) => { e.stopPropagation(); setSellerToDelete(seller._id); setShowDeleteConfirm(true); }}
                        title="Archive Seller"
                      >
                        <Icon name="trash" size={14} />
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
              <Icon name="remove-this-product" />
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
                    <Icon name="restore-inventory" size={16} />
                    Restore Seller
                  </button>
                ) : (
                  !selectedSeller.isArchived && (
                    <>
                      <button
                        className={styles.modalEditBtn}
                        onClick={() => {
                          setEditFormData(selectedSeller);
                          setShowEditModal(true);
                          setSelectedSeller(null);
                        }}
                      >
                        <Icon name="edit-inventory" size={16} />
                        Edit Seller
                      </button>
                      <button
                        className={styles.modalDeleteBtn}
                        onClick={() => { setSellerToDelete(selectedSeller._id); setShowDeleteConfirm(true); }}
                      >
                        <Icon name="trash" size={16} />
                        Archive Seller
                      </button>
                    </>
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
              <Icon name="icon-cfd589e1" size={28} />
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
              <Icon name="restore-inventory" size={28} />
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

      {/* ── Edit Seller Modal ── */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={`${styles.modal} ${styles.editModal}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>
              <Icon name="remove-this-product" />
            </button>
            <div className={styles.modalScroll}>
              <h2 className={styles.modalTitle} style={{ marginBottom: "1.5rem" }}>Edit Seller Details</h2>
              <form onSubmit={submitEdit} className={styles.editForm}>
                
                {/* ── Section: Basic Info ── */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <Icon name="icon-4c39cef6" size={18} />
                    <h3 className={styles.sectionTitle}>Business Information</h3>
                  </div>
                  <div className={styles.grid2}>
                    <Field label="Business Name *" name="businessName" placeholder="e.g., ABC Traders" value={editFormData.businessName} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="GST No" name="gstNo" placeholder="e.g., 27ABCDE1234F1Z5" value={editFormData.gstNo} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Contact Person" name="contactPerson" placeholder="e.g., Ramesh Kumar" value={editFormData.contactPerson} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Email" name="email" type="email" placeholder="e.g., seller@example.com" value={editFormData.email} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Shipping Provider" name="shippingProvider" placeholder="e.g., Delhivery" value={editFormData.shippingProvider} onChange={handleEditChange} disabled={editLoading} />
                  </div>
                </div>

                {/* ── Section: Contact ── */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <Icon name="icon-2d625620" size={18} />
                    <h3 className={styles.sectionTitle}>Contact Numbers</h3>
                  </div>
                  <div className={styles.grid2}>
                    <Field label="Phone No" name="phoneNo" placeholder="+91 98765 43210" value={editFormData.phoneNo} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="WhatsApp No" name="whatsAppNo" placeholder="+91 98765 43210" value={editFormData.whatsAppNo} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Alt Phone No" name="altPhoneNo" placeholder="+91 98765 00000" value={editFormData.altPhoneNo} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Alt WhatsApp No" name="altWhatsAppNo" placeholder="+91 98765 00000" value={editFormData.altWhatsAppNo} onChange={handleEditChange} disabled={editLoading} />
                  </div>
                </div>

                {/* ── Section: Address ── */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <Icon name="icon-28f62de3" size={18} />
                    <h3 className={styles.sectionTitle}>Address</h3>
                  </div>
                  <div className={styles.grid1}>
                    <TextArea label="Address" name="address" placeholder="Street, Area, City" value={editFormData.address} onChange={handleEditChange} disabled={editLoading} />
                  </div>
                  <div className={styles.grid3}>
                    <Field label="Country" name="country" placeholder="e.g., India" value={editFormData.country} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="State" name="state" placeholder="e.g., Maharashtra" value={editFormData.state} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Pin Code" name="pinCode" placeholder="e.g., 400001" value={editFormData.pinCode} onChange={handleEditChange} disabled={editLoading} />
                  </div>
                </div>

                {/* ── Section: Primary Bank ── */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <Icon name="icon-208b8f70" size={18} />
                    <h3 className={styles.sectionTitle}>Primary Banking Details</h3>
                  </div>
                  <div className={styles.grid2}>
                    <Field label="Bank Name" name="bankName" placeholder="e.g., HDFC Bank" value={editFormData.bankName} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Account No" name="accountNo" placeholder="e.g., 1234567890" value={editFormData.accountNo} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="IFSC Code" name="ifscCode" placeholder="e.g., HDFC0001234" value={editFormData.ifscCode} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Branch" name="branch" placeholder="e.g., Andheri West" value={editFormData.branch} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Account Type" name="accountType" placeholder="e.g., Current, Savings" value={editFormData.accountType} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="UPI ID" name="upiId" placeholder="e.g., seller@upi" value={editFormData.upiId} onChange={handleEditChange} disabled={editLoading} />
                  </div>
                </div>

                {/* ── Section: Alternate Bank ── */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <Icon name="icon-208b8f70" size={18} />
                    <h3 className={styles.sectionTitle}>Alternate Banking Details</h3>
                    <span className={styles.optionalBadge}>Optional</span>
                  </div>
                  <div className={styles.grid2}>
                    <Field label="Alt Bank Name" name="altBankName" placeholder="e.g., SBI" value={editFormData.altBankName} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Alt Account No" name="altAccountNo" placeholder="e.g., 00112233" value={editFormData.altAccountNo} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Alt IFSC Code" name="altIfscCode" placeholder="e.g., SBIN0001234" value={editFormData.altIfscCode} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Alt Branch" name="altBranch" placeholder="e.g., Bandra" value={editFormData.altBranch} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Alt Account Type" name="altAccountType" placeholder="e.g., Current" value={editFormData.altAccountType} onChange={handleEditChange} disabled={editLoading} />
                    <Field label="Alt UPI ID" name="altUpiId" placeholder="e.g., alt@upi" value={editFormData.altUpiId} onChange={handleEditChange} disabled={editLoading} />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowEditModal(false)} disabled={editLoading}>Cancel</button>
                  <button type="submit" className={styles.saveBtn} disabled={editLoading}>
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

          </div>
  );
}
