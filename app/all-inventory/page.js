"use client";
import { toast } from "sonner";

import React, { useState, useEffect, useEffectEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import PageShell from "@/components/ui/PageShell/PageShell";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import styles from "./page.module.css";

import InventoryToolbar from "./_components/InventoryToolbar/InventoryToolbar";
import InventoryCard from "./_components/InventoryCard/InventoryCard";
import InventoryPagination from "./_components/InventoryPagination/InventoryPagination";
import InventoryDetailModal from "./_components/InventoryDetailModal/InventoryDetailModal";
import EditInventoryModal from "./_components/EditInventoryModal/EditInventoryModal";
import { fetchVerticalsData } from "../../utils/apiUtils";
import { useAuth } from "../../components/AuthProvider";
import { parseSearchQuery, matchesSearchTerms } from "../../utils/searchUtils";

export default function AllInventoryPage() {
    const [allInventoryData, setAllInventoryData] = useState([]); // All data from API/Local Storage
    const [inventory, setInventory] = useState([]); // Currently displayed filtered/paginated data
    const [verticals, setVerticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState(null);
    const [pageSize, setPageSize] = useState(100);

    // Filter/Sort States
    const [sortOrder, setSortOrder] = useState("newest_first");
    const [selectedVertical, setSelectedVertical] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState(null); // For expander modal
    const [modalSkus, setModalSkus] = useState([]);
    const [modalSkusLoading, setModalSkusLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [showArchived, setShowArchived] = useState(() => searchParams.get('archived') === 'true');
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [itemToRestore, setItemToRestore] = useState(null);
    const [restoreButtonLoading, setRestoreButtonLoading] = useState(false);

    // Edit Modal State
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({
        inventoryId: "",
        vertical: "",
        image: null,
        imagePreview: "",
    });
    const [editSaving, setEditSaving] = useState(false);

    // Permanent Delete State
    const [showPermDeleteConfirm, setShowPermDeleteConfirm] = useState(false);
    const [itemToPermDelete, setItemToPermDelete] = useState(null);
    const [permDeleteLoading, setPermDeleteLoading] = useState(false);

    const STALE_THRESHOLD_MS = 60 * 1000; // 1 minute
    // Ref to track current showArchived value inside the stale event listener closure
    const showArchivedRef = React.useRef(showArchived);
    useEffect(() => { showArchivedRef.current = showArchived; }, [showArchived]);

    // Mount-only load; useEffectEvent keeps it from re-running when the loaders change identity
    const loadOnMount = useEffectEvent(() => {
        loadInitialData();
        const initialArchived = searchParams.get('archived') === 'true';
        fetchInventory(false, initialArchived);
    });

    useEffect(() => {
        loadOnMount();
    }, []);

    useEffect(() => {
        if (selectedItem) {
            setModalSkus([]);
            setModalSkusLoading(true);
            fetch(`/api/employee/inventory/skus?inventoryId=${selectedItem.inventoryId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setModalSkus(data.skus || []);
                    } else {
                        console.error("Failed to load SKUs:", data.error);
                    }
                })
                .catch(err => console.error("Error fetching SKUs:", err))
                .finally(() => setModalSkusLoading(false));
        }
    }, [selectedItem]);

    // Apply Filters, Sort, and Pagination locally whenever dependencies change
    // Re-run only for these inputs; useEffectEvent reads the latest processLocalData
    const onLocalDataInputsChange = useEffectEvent(() => processLocalData());

    useEffect(() => {
        onLocalDataInputsChange();
    }, [allInventoryData, currentPage, sortOrder, selectedVertical, searchQuery, pageSize, showArchived]);

    const processLocalData = () => {
        let filtered = [...allInventoryData];

        // 0. Filter by archived state — only show what belongs to current view
        filtered = filtered.filter(item =>
            showArchived ? item.isArchived === true : !item.isArchived
        );

        // 1. Filter by vertical
        if (selectedVertical) {
            filtered = filtered.filter(item => item.vertical === selectedVertical);
        }

        // 2. Filter by Search Query
        if (searchQuery) {
            const { includeTerms, excludeTerms } = parseSearchQuery(searchQuery);
            filtered = filtered.filter(item =>
                matchesSearchTerms(item.inventoryId, includeTerms, excludeTerms)
            );
        }

        // 3. Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            if (sortOrder === "newest_first") {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

        // 4. Update Total Items (for Pagination math)
        setTotalItems(filtered.length);

        // 5. Paginate
        const startIndex = (currentPage - 1) * pageSize;
        const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

        setInventory(paginatedItems);
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            setCurrentPage(1);
            // processLocalData is triggered by useEffect
        }
    };

    const handleReset = () => {
        setSearchQuery("");
        setSelectedVertical("");
        setSortOrder("newest_first");
        setCurrentPage(1); // Resetting page
    };

    const handleRefresh = () => {
        setCurrentPage(1);
        fetchInventory(true, showArchived); // Force fetch from server, respecting archived state
    };

    const handleDelete = (id) => {
        setItemToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        const id = itemToDelete;
        setDeletingItemId(id);
        setDeleteButtonLoading(true);

        try {
            const response = await fetch(`/api/employee/inventory/add?id=${id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Inventory archived successfully.", { id: "app-feedback", duration: 3000 });
                // Update local data
                const updatedData = allInventoryData.filter(item => item._id !== id);
                setAllInventoryData(updatedData);
            } else {
                toast.error(result.error || "Failed to archive inventory.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Network Error:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setDeleteButtonLoading(false);
            setDeletingItemId(null);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };

    const handleRestore = (id) => {
        setItemToRestore(id);
        setShowRestoreConfirm(true);
    };

    const confirmRestore = async () => {
        if (!itemToRestore) return;
        const id = itemToRestore;
        setRestoreButtonLoading(true);

        try {
            const response = await fetch(`/api/employee/inventory/add`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "restore" })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Inventory restored successfully.", { id: "app-feedback", duration: 3000 });
                fetchInventory(true);
            } else {
                toast.error(result.error || "Failed to restore inventory.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Network Error:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setRestoreButtonLoading(false);
            setShowRestoreConfirm(false);
            setItemToRestore(null);
        }
    };

    const handlePermanentDelete = (id) => {
        setItemToPermDelete(id);
        setShowPermDeleteConfirm(true);
    };

    const confirmPermanentDelete = async () => {
        if (!itemToPermDelete) return;
        setPermDeleteLoading(true);
        try {
            const res = await fetch(`/api/employee/inventory/add?id=${itemToPermDelete}&permanent=true`, {
                method: "DELETE",
            });
            const result = await res.json();
            if (res.ok && result.success) {
                toast.success("Inventory item permanently deleted.", { id: "app-feedback", duration: 3000 });
                const updatedData = allInventoryData.filter(item => item._id !== itemToPermDelete);
                setAllInventoryData(updatedData);
            } else {
                toast.error(result.error || "Failed to permanently delete item.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Permanent Delete Error:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setPermDeleteLoading(false);
            setShowPermDeleteConfirm(false);
            setItemToPermDelete(null);
        }
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setEditForm({
            inventoryId: item.inventoryId || "",
            vertical: item.vertical || "",
            image: null,
            imagePreview: item.imageUrl || "",
        });
    };

    const closeEditModal = () => {
        setEditingItem(null);
        setEditForm({ inventoryId: "", vertical: "", image: null, imagePreview: "" });
    };

    const handleEditFormChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image" && files && files[0]) {
            const file = files[0];
            setEditForm(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }));
        } else {
            setEditForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingItem) return;
        if (!editForm.inventoryId.trim()) {
            toast.error("Inventory ID is required.", { id: "app-feedback", duration: 3000 });
            return;
        }
        if (!editForm.vertical.trim()) {
            toast.error("Vertical is required.", { id: "app-feedback", duration: 3000 });
            return;
        }

        setEditSaving(true);
        try {
            const formData = new FormData();
            formData.append("id", editingItem._id);
            formData.append("inventoryId", editForm.inventoryId.trim());
            formData.append("vertical", editForm.vertical.trim());
            if (editForm.image) {
                formData.append("image", editForm.image);
            }

            const res = await fetch("/api/employee/inventory/add", {
                method: "PUT",
                body: formData,
            });

            const result = await res.json();
            if (res.ok && result.success) {
                toast.success("Inventory item updated successfully.", { id: "app-feedback", duration: 3000 });
                fetchInventory(true, showArchived);
                closeEditModal();
            } else {
                toast.error(result.error || "Failed to update inventory item.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Save Edit Error:", error);
            toast.error("Network error while saving inventory item.", { id: "app-feedback", duration: 3000 });
        } finally {
            setEditSaving(false);
        }
    };

    const copyToClipboard = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard!`, { id: "app-feedback", duration: 3000 });
        } catch (err) {
            console.error("Failed to copy:", err);
            toast.error("Failed to copy to clipboard", { id: "app-feedback", duration: 3000 });
        }
    };

    const loadInitialData = async () => {
        const pin = sessionStorage.getItem("app_pin");
        try {
            const cachedVerticals = await fetchVerticalsData(pin);
            setVerticals(cachedVerticals || []);
        } catch (error) {
            console.error("Failed to load verticals:", error);
        }
    };

    const fetchInventory = async (forceRefresh = false, fetchArchived = false) => {
        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        toast.dismiss("app-feedback");

        try {
            const url = `/api/employee/inventory${fetchArchived ? '?showArchived=true' : ''}`;
            const response = await fetch(url);
            const result = await response.json();

            if (response.ok) {
                const fetchedData = result.data || [];
                setAllInventoryData(fetchedData);

                if (forceRefresh) {
                    toast.success("Inventory refreshed successfully.", { id: "app-feedback", duration: 3000 });
                }
            } else {
                toast.error(result.error || "Failed to load inventory.", { id: "app-feedback", duration: 3000 });
                if (!allInventoryData.length) setAllInventoryData([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Network error while loading data.", { id: "app-feedback", duration: 3000 });
            if (!allInventoryData.length) setAllInventoryData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleNextPage = () => setCurrentPage(prev => Math.min(Math.ceil(totalItems / pageSize) || 1, prev + 1));
    const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));

    const handleSearchQueryChange = (e) => setSearchQuery(e.target.value);

    const handleVerticalChange = (e) => {
        setSelectedVertical(e.target.value);
        setCurrentPage(1);
    };

    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
        setCurrentPage(1);
    };

    const handleToggleArchived = () => {
        const newArchivedState = !showArchived;
        setShowArchived(newArchivedState);
        setCurrentPage(1);
        // Sync URL
        const params = new URLSearchParams(window.location.search);
        if (newArchivedState) {
            params.set('archived', 'true');
        } else {
            params.delete('archived');
        }
        router.replace(`?${params.toString()}`, { scroll: false });
        fetchInventory(true, newArchivedState);
    };

    const handlePageSizeChange = e => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    return (
        <PageShell>
            <InventoryToolbar
                user={user}
                verticals={verticals}
                searchQuery={searchQuery}
                onSearchQueryChange={handleSearchQueryChange}
                onSearch={handleSearch}
                selectedVertical={selectedVertical}
                onVerticalChange={handleVerticalChange}
                sortOrder={sortOrder}
                onSortOrderChange={handleSortOrderChange}
                onReset={handleReset}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                showArchived={showArchived}
                onToggleArchived={handleToggleArchived}
            />

            {loading ? (
                <div className={styles.grid} role="status" aria-busy="true">
                    <span className="srOnly">Loading Inventory...</span>
                    {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <Skeleton className={styles.skeletonMedia} />
                            <Skeleton variant="text" width="70%" />
                            <Skeleton variant="text" width="40%" />
                        </div>
                    ))}
                </div>
            ) : inventory.length === 0 ? (
                <EmptyState title="No inventory items found." />
            ) : (
                <>
                    <div className={styles.grid}>
                        {inventory.map((item) => (
                            <InventoryCard
                                key={item._id}
                                item={item}
                                user={user}
                                restoreButtonLoading={restoreButtonLoading}
                                deleteButtonLoading={deleteButtonLoading}
                                deletingItemId={deletingItemId}
                                onRestore={handleRestore}
                                onDelete={handleDelete}
                                onPermanentDelete={handlePermanentDelete}
                                onEdit={openEditModal}
                                onCopy={copyToClipboard}
                                onSelect={setSelectedItem}
                            />
                        ))}
                    </div>

                    {totalItems > 0 && (
                        <InventoryPagination
                            currentPage={currentPage}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            onPageSizeChange={handlePageSizeChange}
                            onPrevPage={handlePrevPage}
                            onNextPage={handleNextPage}
                        />
                    )}
                </>
            )}

            <ConfirmModal
                isOpen={showDeleteConfirm}
                variant="warning"
                title="Confirm Archiving"
                message="Are you sure you want to archive this inventory item? It will be hidden from all standard views."
                confirmLabel={deleteButtonLoading ? "Archiving..." : "Confirm Archive"}
                isLoading={deleteButtonLoading}
                onConfirm={confirmDelete}
                onClose={() => setShowDeleteConfirm(false)}
            />

            <ConfirmModal
                isOpen={showRestoreConfirm}
                variant="info"
                title="Confirm Restore"
                message="Are you sure you want to restore this inventory item? It will be visible again in standard views."
                confirmLabel={restoreButtonLoading ? "Restoring..." : "Confirm Restore"}
                isLoading={restoreButtonLoading}
                onConfirm={confirmRestore}
                onClose={() => setShowRestoreConfirm(false)}
            />

            {selectedItem && (
                <InventoryDetailModal
                    selectedItem={selectedItem}
                    modalSkus={modalSkus}
                    modalSkusLoading={modalSkusLoading}
                    onClose={() => setSelectedItem(null)}
                    onCopy={copyToClipboard}
                />
            )}

            <ConfirmModal
                isOpen={showPermDeleteConfirm}
                variant="danger"
                title="Permanently Delete"
                message={<>This will <strong>permanently delete</strong> this inventory item and cannot be undone. Are you sure?</>}
                confirmLabel={permDeleteLoading ? "Deleting..." : "Delete Forever"}
                isLoading={permDeleteLoading}
                onConfirm={confirmPermanentDelete}
                onClose={() => setShowPermDeleteConfirm(false)}
            />

            {editingItem && (
                <EditInventoryModal
                    editForm={editForm}
                    verticals={verticals}
                    editSaving={editSaving}
                    onChange={handleEditFormChange}
                    onSubmit={handleSaveEdit}
                    onClose={closeEditModal}
                />
            )}
        </PageShell>
    );
}
