"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";


import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";

import SmoothImage from "../../components/SmoothImage/SmoothImage";
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

    useEffect(() => {
        loadInitialData();
        const initialArchived = searchParams.get('archived') === 'true';
        fetchInventory(false, initialArchived);
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
    useEffect(() => {
        processLocalData();
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>All Inventory</h1>

                <div className={styles.controlsRow}>
                    <div className={styles.filtersGroup}>
                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="Search Inventory ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                className={styles.searchInput}
                            />
                            <button className={styles.searchBtn} onClick={handleSearch} title="Search">
                                <Icon name="icon-9c4a10ac" size={18} />
                            </button>
                        </div>

                        <select
                            className={styles.filterSelect}
                            value={selectedVertical}
                            onChange={(e) => {
                                setSelectedVertical(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">All Verticals</option>
                            {verticals.map(v => (
                                <option key={v.verticalShort} value={v.verticalName}>{v.verticalName}</option>
                            ))}
                        </select>

                        <select
                            className={styles.filterSelect}
                            value={sortOrder}
                            onChange={(e) => {
                                setSortOrder(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="newest_first">Newest First</option>
                            <option value="oldest_first">Oldest First</option>
                        </select>

                        <button
                            className={styles.resetBtn}
                            onClick={handleReset}
                            title="Reset Filters"
                        >
                            <Icon name="reset-filters" size={18} />
                            Reset
                        </button>

                        <button
                            className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ''}`}
                            onClick={handleRefresh}
                            disabled={refreshing}
                            title="Refresh Data"
                        >
                            <Icon name="refresh" size={18} />
                            Refresh
                        </button>

                        {(user?.role === 'admin' || user?.role === 'superadmin') && (
                            <button
                                className={`${styles.refreshBtn} ${showArchived ? styles.activeView : ''}`}
                                onClick={() => {
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
                                }}
                                title={showArchived ? "Hide Archived" : "Show Archived"}
                                style={showArchived ? { backgroundColor: 'var(--accent-color, #3b82f6)', color: 'white', borderColor: 'var(--accent-color, #3b82f6)' } : {}}
                            >
                                <Icon name="icon-fb9fc010" size={18} />
                                {showArchived ? "Hide Archived" : "Show Archived"}
                            </button>
                        )}
                    </div>


                </div>
            </div>

            {loading ? (
                <div className={styles.loadingContainer} style={{ flex: 1 }}>
                    <div className={styles.spinner}></div>
                    <p>Loading Inventory...</p>
                </div>
            ) : inventory.length === 0 ? (
                <div className={styles.emptyState} style={{ flex: 1 }}>
                    <p>No inventory items found.</p>
                </div>
            ) : (
                <div className={styles.contentArea}>
                    <div className={styles.scrollWrapper}>
                        <div className={styles.gridContainer}>
                                {inventory.map((item) => {
                                    const canArchive = user?.role === 'admin' || user?.role === 'superadmin' || item.addedBy === user?.id;
                                    return (
                                    <div 
                                        key={item._id} 
                                        className={styles.gridCard}
                                    >
                                        {item.isArchived ? (
                                            <button
                                                type="button"
                                                onClick={() => handleRestore(item._id)}
                                                className={styles.deleteBtn}
                                                title="Restore Inventory"
                                                disabled={restoreButtonLoading}
                                            >
                                                <Icon name="restore-inventory" size={16} />
                                            </button>
                                        ) : canArchive ? (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item._id)}
                                                className={styles.deleteBtn}
                                                title="Archive Inventory"
                                                disabled={deleteButtonLoading}
                                            >
                                                {deleteButtonLoading && deletingItemId === item._id
                                                    ? <Icon name="refresh-loop" size={16} className={styles.deleteLoadingIcon} />
                                                    : <Icon name="trash" size={16} className={styles.deleteIcon} />
                                                }
                                            </button>
                                        ) : null}

                                        {item.isArchived ? (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePermanentDelete(item._id);
                                                }}
                                                className={styles.editCardBtn}
                                                title="Permanently Delete"
                                            >
                                                <Icon name="permanently-delete" size={14} />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(item);
                                                }}
                                                className={styles.editCardBtn}
                                                title="Edit Inventory"
                                            >
                                                <Icon name="edit-inventory" size={14} />
                                            </button>
                                        )}

                                        <div className={styles.imageContainer}>
                                            {item.imageUrl ? (
                                                <SmoothImage
                                                    src={item.imageUrl}
                                                    alt={item.inventoryId}
                                                    fill
                                                    className={styles.itemImage}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className={styles.imagePlaceholder}>No Image</div>
                                            )}
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <div className={styles.skuHeaderRow}>
                                                <p className={styles.itemId} title={item.inventoryId}>{item.inventoryId}</p>
                                                <button
                                                    className={styles.smallCopyBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyToClipboard(item.inventoryId, "SKU");
                                                    }}
                                                    title="Copy SKU"
                                                >
                                                    <Icon name="copy-inventory-id" size={14} />
                                                </button>
                                            </div>
                                            <p className={styles.itemDate}>
                                                {new Date(item.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </p>
                                            <div className={styles.stockAndPriceContainer}>
                                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                    <div className={styles.stockBadge}>
                                                        <span className={styles.stockLabel}>Stock:</span>
                                                        <span className={`${styles.stockValue} ${item.currentStock <= 10 ? styles.lowStock : ''}`}>
                                                            {item.currentStock ?? 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className={styles.itemPrice}>
                                                    ₹{item.fifoUnitCost ?? 0}
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className={styles.clickableOverlay}
                                            onClick={() => setSelectedItem(item)}
                                        />
                                    </div>
                                )})}
                            </div>
                    </div>

                    {/* Pagination */}
                    {totalItems > 0 && (
                        <div className={styles.pagination}>
                            <div className={styles.paginationLeft}>
                                <span className={styles.pageInfo}>
                                    Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                                </span>

                                <div className={styles.pageSizeWrapper}>
                                    <label htmlFor="pageSizeSelect" className={styles.pageSizeLabel}>Rows per page:</label>
                                    <select
                                        id="pageSizeSelect"
                                        className={styles.pageSizeSelect}
                                        value={pageSize}
                                        onChange={e => {
                                            setPageSize(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {[20, 50, 100, 500, 5000].map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.pageControls}>
                                <button className={styles.pageBtn} disabled={currentPage === 1}
                                    onClick={handlePrevPage}>
                                    Previous
                                </button>
                                <span className={styles.pageDisplay}>Page {currentPage} of {Math.ceil(totalItems / pageSize) || 1}</span>
                                <button className={styles.pageBtn} disabled={currentPage >= (Math.ceil(totalItems / pageSize) || 1)}
                                    onClick={handleNextPage}>
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

                     {showDeleteConfirm && (
                <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div className={styles.warningIcon}>
                                <Icon name="icon-cfd589e1" size={24} />
                            </div>
                            <h3 className={styles.confirmTitle}>Confirm Archiving</h3>
                        </div>
                        <p className={styles.confirmMessage}>
                            Are you sure you want to archive this inventory item? It will be hidden from all standard views.
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteButtonLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.confirmDeleteBtn}
                                onClick={confirmDelete}
                                disabled={deleteButtonLoading}
                            >
                                {deleteButtonLoading ? "Archiving..." : "Confirm Archive"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRestoreConfirm && (
                <div className={styles.confirmOverlay} onClick={() => setShowRestoreConfirm(false)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div className={styles.restoreIcon} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                                <Icon name="restore-inventory" size={24} />
                            </div>
                            <h3 className={styles.confirmTitle}>Confirm Restore</h3>
                        </div>
                        <p className={styles.confirmMessage}>
                            Are you sure you want to restore this inventory item? It will be visible again in standard views.
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowRestoreConfirm(false)}
                                disabled={restoreButtonLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.confirmDeleteBtn}
                                style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
                                onClick={confirmRestore}
                                disabled={restoreButtonLoading}
                            >
                                {restoreButtonLoading ? "Restoring..." : "Confirm Restore"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedItem && (
                <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModal} onClick={() => setSelectedItem(null)}>
                            <Icon name="remove-this-product" size={24} />
                        </button>

                        <div className={styles.modalScrollArea}>
                            <div className={styles.modalHeader}>
                                <div className={styles.modalImageContainer}>
                                    {selectedItem.imageUrl ? (
                                        <SmoothImage
                                            src={selectedItem.imageUrl}
                                            alt={selectedItem.inventoryId}
                                            fill
                                            className={styles.modalImage}
                                            unoptimized
                                        />
                                    ) : (
                                        <div className={styles.modalImagePlaceholder}>No Image</div>
                                    )}
                                </div>
                                <div className={styles.modalMainInfo}>
                                    <div className={styles.idWithCopy}>
                                        <h2 className={styles.modalId}>{selectedItem.inventoryId}</h2>
                                        <button
                                            className={styles.copyButton}
                                            onClick={() => copyToClipboard(selectedItem.inventoryId, "Inventory ID")}
                                            title="Copy ID"
                                        >
                                            <Icon name="copy-inventory-id" size={16} />
                                        </button>
                                    </div>
                                    <p className={styles.modalVertical}>{selectedItem.vertical}</p>
                                    <p className={styles.modalDate}>
                                        {selectedItem?.createdAt ? `Added on ${new Date(selectedItem.createdAt).toLocaleString('en-IN', {
                                            month: 'long', day: 'numeric', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}` : ''}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.metricsGrid}>
                                <div className={`${styles.metricCard} ${styles.highlightMetric}`}>
                                    <span className={styles.metricLabel}>Unit Price</span>
                                    <span className={styles.metricValue}>₹ {Math.ceil(selectedItem.buyPriceUnit ?? 0)}</span>
                                </div>
                                <div className={`${styles.metricCard} ${styles.highlightMetric}`}>
                                    <span className={styles.metricLabel}>Current Stock</span>
                                    <span className={styles.metricValue}>{selectedItem.currentStock ?? 0}</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>Initial Stock</span>
                                    <span className={styles.metricValue}>{selectedItem.initialStock ?? 0}</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>Gross Ordered</span>
                                    <span className={styles.metricValue}>{selectedItem.grossOrdered ?? 0}</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>Net Sold</span>
                                    <span className={styles.metricValue}>{selectedItem.netSold ?? 0}</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>Cancelled</span>
                                    <span className={styles.metricValue}>{selectedItem.cancelled ?? 0}</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricLabel}>Returned</span>
                                    <span className={styles.metricValue}>{selectedItem.returned ?? 0}</span>
                                </div>
                            </div>

                            {/* SKUs Section */}
                            {modalSkusLoading ? (
                                <div className={styles.modalSection}>
                                    <h3 className={styles.sectionTitle}>Associated SKUs</h3>
                                    <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>Loading SKUs...</p>
                                </div>
                            ) : (
                                modalSkus && modalSkus.length > 0 && (
                                    <div className={styles.modalSection}>
                                        <h3 className={styles.sectionTitle}>Associated SKUs</h3>
                                        <div className={styles.skuGrid}>
                                            {modalSkus.map((sku, index) => (
                                                <div key={index} className={`${styles.skuCard} ${sku.status?.toLowerCase() === 'active' ? styles.activeSku : sku.status?.toLowerCase() === 'blocked' ? styles.blockedSku : styles.inactiveSku}`}>
                                                <div className={styles.skuInfo}>
                                                    <div className={styles.skuMain}>
                                                        <span className={styles.skuIdLabel}>SKU ID</span>
                                                        <div className={styles.skuIdWithCopy}>
                                                            <span className={styles.skuIdValue}>{sku.skuId}</span>
                                                            <button
                                                                className={styles.copyButtonSmall}
                                                                onClick={() => copyToClipboard(sku.skuId, "SKU ID")}
                                                                title="Copy SKU ID"
                                                            >
                                                                <Icon name="copy-inventory-id" size={14} />
                                                            </button>
                                                        </div>
                                                        <span className={`${styles.statusBadge} ${sku.status?.toLowerCase() === 'active' ? styles.activeStatus : sku.status?.toLowerCase() === 'blocked' ? styles.blockedStatus : styles.inactiveStatus}`}>
                                                            {sku.status?.charAt(0).toUpperCase() + sku.status?.slice(1)}
                                                        </span>
                                                    </div>
                                                    <div className={styles.skuBadges}>
                                                        <span className={styles.marketplaceBadge}>{sku.marketplace}</span>
                                                        <span className={styles.netSoldBadge}>Sold: {sku.netSold}</span>
                                                    </div>
                                                </div>

                                                {/* Combo Items */}
                                                {sku.comboItems && sku.comboItems.length > 0 && (
                                                    <div className={styles.comboSection}>
                                                        <span className={styles.comboLabel}>Combo Items</span>
                                                        <div className={styles.comboGrid}>
                                                            {sku.comboItems.map((combo, cIndex) => (
                                                                <div key={cIndex} className={styles.comboItem}>
                                                                    <div className={styles.comboImageWrapper}>
                                                                        {combo.imageUrl ? (
                                                                            <Image
                                                                                src={combo.imageUrl}
                                                                                alt={combo.inventoryId}
                                                                                fill
                                                                                className={styles.comboImg}
                                                                                unoptimized
                                                                            />
                                                                        ) : (
                                                                            <div className={styles.comboPlaceholder}>NA</div>
                                                                        )}
                                                                    </div>
                                                                    <div className={styles.comboIdContainer}>
                                                                        <span className={styles.comboId}>{combo.inventoryId}</span>
                                                                        <button
                                                                            className={styles.copyButtonTiny}
                                                                            onClick={() => copyToClipboard(combo.inventoryId, "Combo Inventory ID")}
                                                                            title="Copy ID"
                                                                        >
                                                                            <Icon name="copy-inventory-id" size={12} />
                                                                        </button>
                                                                    </div>
                                                                    <div className={styles.comboQuantity}>
                                                                        <span className={styles.comboQtyLabel}>Stock: </span>
                                                                        <span className={styles.comboQtyValue}>{combo.currentStock}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {showPermDeleteConfirm && (
                <div className={styles.confirmOverlay} onClick={() => setShowPermDeleteConfirm(false)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div className={styles.warningIcon}>
                                <Icon name="permanently-delete" size={24} />
                            </div>
                            <h3 className={styles.confirmTitle}>Permanently Delete</h3>
                        </div>
                        <p className={styles.confirmMessage}>
                            This will <strong>permanently delete</strong> this inventory item and cannot be undone. Are you sure?
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowPermDeleteConfirm(false)}
                                disabled={permDeleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.confirmDeleteBtn}
                                onClick={confirmPermanentDelete}
                                disabled={permDeleteLoading}
                                style={{ backgroundColor: '#f43f5e' }}
                            >
                                {permDeleteLoading ? "Deleting..." : "Delete Forever"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingItem && (
                <div className={styles.confirmOverlay} onClick={closeEditModal}>
                    <div className={styles.confirmModal} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmHeader}>
                            <div style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                                <Icon name="edit-inventory" />
                            </div>
                            <h3 className={styles.confirmTitle}>Edit Inventory Item</h3>
                        </div>

                        <form onSubmit={handleSaveEdit} className={styles.editModalForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Inventory ID / SKU</label>
                                <input
                                    type="text"
                                    name="inventoryId"
                                    value={editForm.inventoryId}
                                    onChange={handleEditFormChange}
                                    className={styles.formInput}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Vertical</label>
                                <select
                                    name="vertical"
                                    value={editForm.vertical}
                                    onChange={handleEditFormChange}
                                    className={styles.formSelect}
                                    required
                                >
                                    <option value="">Select Vertical</option>
                                    {verticals.map(v => (
                                        <option key={v.verticalShort} value={v.verticalName}>{v.verticalName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Inventory Image</label>
                                <div className={styles.imagePreviewWrapper}>
                                    {editForm.imagePreview && (
                                        <img
                                            src={editForm.imagePreview}
                                            alt="Preview"
                                            className={styles.imagePreview}
                                        />
                                    )}
                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleEditFormChange}
                                        className={styles.fileInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.editModalFooter}>
                                <button
                                    type="button"
                                    className={styles.cancelBtn}
                                    onClick={closeEditModal}
                                    disabled={editSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.saveBtn}
                                    disabled={editSaving}
                                >
                                    {editSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

