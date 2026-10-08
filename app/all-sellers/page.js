"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import PageShell from "@/components/ui/PageShell/PageShell";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";

import React, { useState, useEffect, useEffectEvent } from "react";
import styles from "./page.module.css";

import { useAuth } from "../../components/AuthProvider";
import { parseSearchQuery, matchesArraySearchTerms } from "../../utils/searchUtils";
import SellersToolbar from "./_components/SellersToolbar/SellersToolbar";
import SellerCard from "./_components/SellerCard/SellerCard";
import SellersPagination from "./_components/SellersPagination/SellersPagination";
import SellerDetailModal from "./_components/SellerDetailModal/SellerDetailModal";
import EditSellerModal from "./_components/EditSellerModal/EditSellerModal";

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

  // Mount-only load; useEffectEvent keeps it from re-running when fetchSellers changes identity
  const loadOnMount = useEffectEvent(() => fetchSellers());
  useEffect(() => { loadOnMount(); }, []);

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

  /* ── UI handlers ── */
  const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
  const clearSearch = () => { setSearchQuery(""); setCurrentPage(1); };
  const handleRefresh = () => fetchSellers(true);
  const toggleArchived = () => {
    const newVal = !showArchived;
    setShowArchived(newVal);
    setCurrentPage(1);
    fetchSellers(true, newVal);
  };
  const handlePageSizeChange = (e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); };
  const handlePrevPage = () => setCurrentPage((p) => p - 1);
  const handleNextPage = () => setCurrentPage((p) => p + 1);

  const selectSeller = (seller) => setSelectedSeller(seller);
  const closeDetailModal = () => setSelectedSeller(null);
  const openRestoreConfirm = (id) => { setSellerToRestore(id); setShowRestoreConfirm(true); };
  const openDeleteConfirm = (id) => { setSellerToDelete(id); setShowDeleteConfirm(true); };
  const openEditModal = () => {
    setEditFormData(selectedSeller);
    setShowEditModal(true);
    setSelectedSeller(null);
  };
  const cancelDelete = () => { setShowDeleteConfirm(false); setSellerToDelete(null); };
  const cancelRestore = () => { setShowRestoreConfirm(false); setSellerToRestore(null); };
  const closeEditModal = () => setShowEditModal(false);

  return (
    <PageShell>
      <SellersToolbar
        user={user}
        totalItems={totalItems}
        searchQuery={searchQuery}
        refreshing={refreshing}
        showArchived={showArchived}
        onSearchChange={handleSearchChange}
        onClearSearch={clearSearch}
        onRefresh={handleRefresh}
        onToggleArchived={toggleArchived}
      />

      {/* ── Content ── */}
      {loading ? (
        <div className={styles.grid} role="status" aria-busy="true">
          <span className="srOnly">Loading sellers...</span>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonTop}>
                <Skeleton className={styles.skeletonAvatar} />
                <Skeleton variant="text" width="60%" />
              </div>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="50%" />
            </div>
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <EmptyState
          icon={<Icon name="icon-d5851a0c" size={48} />}
          title={searchQuery ? "No sellers match your search." : "No sellers found. Add one to get started."}
        />
      ) : (
        <>
          <div className={styles.grid}>
            {sellers.map((seller) => (
              <SellerCard
                key={seller._id}
                seller={seller}
                user={user}
                onSelect={selectSeller}
                onRestore={openRestoreConfirm}
                onArchive={openDeleteConfirm}
              />
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalItems > pageSize && (
            <SellersPagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageSizeChange={handlePageSizeChange}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
            />
          )}
        </>
      )}

      {/* ── Detail Modal ── */}
      {selectedSeller && (
        <SellerDetailModal
          selectedSeller={selectedSeller}
          user={user}
          onClose={closeDetailModal}
          onRestore={openRestoreConfirm}
          onEdit={openEditModal}
          onArchive={openDeleteConfirm}
        />
      )}

      {/* ── Archive Confirm ── */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        variant="warning"
        title="Archive Seller?"
        message="Are you sure you want to archive this seller? They will be hidden from the active list."
        confirmLabel={deleteLoading ? "Archiving..." : "Confirm Archive"}
        isLoading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />

      {/* ── Restore Confirm ── */}
      <ConfirmModal
        isOpen={showRestoreConfirm}
        variant="info"
        title="Restore Seller?"
        message="Are you sure you want to restore this seller? They will become active again."
        confirmLabel={restoreLoading ? "Restoring..." : "Confirm Restore"}
        isLoading={restoreLoading}
        onConfirm={confirmRestore}
        onClose={cancelRestore}
      />

      {/* ── Edit Seller Modal ── */}
      {showEditModal && (
        <EditSellerModal
          editFormData={editFormData}
          editLoading={editLoading}
          onEditChange={handleEditChange}
          onSubmit={submitEdit}
          onClose={closeEditModal}
        />
      )}
    </PageShell>
  );
}
