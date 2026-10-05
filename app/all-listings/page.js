"use client";
import { toast } from "sonner";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

import { fetchVerticalsData } from "../../utils/apiUtils";
import * as XLSX from "xlsx";
import { parseSearchQuery, matchesSearchTerms, matchesArraySearchTerms } from "../../utils/searchUtils";
import ListingsToolbar from "./_components/ListingsToolbar/ListingsToolbar";
import ListingCard from "./_components/ListingCard/ListingCard";
import ListingsPagination from "./_components/ListingsPagination/ListingsPagination";
import ListingDetailModal from "./_components/ListingDetailModal/ListingDetailModal";
import EditListingModal from "./_components/EditListingModal/EditListingModal";
import InventoryPickerModal from "./_components/InventoryPickerModal/InventoryPickerModal";
import DeleteListingModal from "./_components/DeleteListingModal/DeleteListingModal";

export default function AllListingsPage() {
    const [allListingsData, setAllListingsData] = useState([]); // All data from API/Local Storage
    const [listings, setListings] = useState([]); // Currently displayed filtered/paginated data
    const [verticals, setVerticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingListingId, setDeletingListingId] = useState(null);
    const [pageSize, setPageSize] = useState(100);

    // Delete Confirmation Modal State
    const [deletingListing, setDeletingListing] = useState(null);
    const [deleteInputText, setDeleteInputText] = useState("");

    // Filter/Sort States
    const [sortOrder, setSortOrder] = useState("newest_first");
    const [selectedVertical, setSelectedVertical] = useState("");
    const [selectedMarketplace, setSelectedMarketplace] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [inventoryIdQuery, setInventoryIdQuery] = useState("");
    const [styleIdQuery, setStyleIdQuery] = useState("");

    // Detail Modal State
    const [selectedListing, setSelectedListing] = useState(null);

    // Edit Modal State
    const [editingListing, setEditingListing] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editSaving, setEditSaving] = useState(false);

    // Inventory Picker State
    const [showInventoryPicker, setShowInventoryPicker] = useState(false);
    const [inventoryPickerItems, setInventoryPickerItems] = useState([]);
    const [inventoryPickerLoading, setInventoryPickerLoading] = useState(false);
    const [inventoryPickerSearch, setInventoryPickerSearch] = useState("");

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadInitialData();
        fetchListings(false); // Try loading from local storage first
    }, []);

    // Apply Filters, Sort, and Pagination locally whenever dependencies change
    useEffect(() => {
        processLocalData();
    }, [allListingsData, currentPage, sortOrder, selectedVertical, selectedMarketplace, selectedStatus, searchQuery, inventoryIdQuery, styleIdQuery, pageSize]);

    const getFilteredListings = () => {
        let filtered = [...allListingsData];

        // 1. Filter by vertical
        if (selectedVertical) {
            filtered = filtered.filter(item => item.vertical === selectedVertical);
        }

        // 1.5 Filter by marketplace
        if (selectedMarketplace) {
            filtered = filtered.filter(item => (item.marketplace || "Direct") === selectedMarketplace);
        }

        // 2. Filter by Search Query (SKU ID)
        if (searchQuery) {
            const { includeTerms, excludeTerms } = parseSearchQuery(searchQuery);
            filtered = filtered.filter(item =>
                matchesSearchTerms(item.skuId, includeTerms, excludeTerms)
            );
        }

        // 3. Filter by Inventory ID
        if (inventoryIdQuery) {
            const { includeTerms, excludeTerms } = parseSearchQuery(inventoryIdQuery);
            filtered = filtered.filter(item => {
                const invIds = item.inventoryItems?.map(inv => inv.inventoryId).filter(Boolean) || [];
                return matchesArraySearchTerms(invIds, includeTerms, excludeTerms);
            });
        }

        // 3.5 Filter by Style ID (Myntra)
        if (styleIdQuery) {
            const { includeTerms, excludeTerms } = parseSearchQuery(styleIdQuery);
            filtered = filtered.filter(item =>
                matchesSearchTerms(item.styleId, includeTerms, excludeTerms)
            );
        }

        // 3.6 Filter by Status
        if (selectedStatus) {
            filtered = filtered.filter(item =>
                item.status?.toLowerCase() === selectedStatus.toLowerCase()
            );
        }

        // 4. Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            if (sortOrder === "newest_first") {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

        return filtered;
    };

    const processLocalData = () => { 
        const filtered = getFilteredListings();

        // 5. Update Total Items (for Pagination math)
        setTotalItems(filtered.length);

        // 6. Paginate
        const startIndex = (currentPage - 1) * pageSize;
        const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

        setListings(paginatedItems);
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            setCurrentPage(1);
            // processLocalData is triggered by useEffect
        }
    };

    const handleReset = () => {
        setSearchQuery("");
        setInventoryIdQuery("");
        setStyleIdQuery("");
        setSelectedVertical("");
        setSelectedMarketplace("");
        setSelectedStatus("");
        setSortOrder("newest_first");
        setCurrentPage(1); // Resetting page
    };

    const handleRefresh = () => {
        setCurrentPage(1);
        fetchListings(true); // Force fetch from server
    };

    const openEditModal = (listing) => {
        setEditingListing(listing);
        setEditForm({
            vertical: listing.vertical || "",
            marketplace: listing.marketplace || "",
            status: listing.status || "active",
            styleId: listing.styleId || "",
            inventoryItems: listing.inventoryItems?.map(inv => inv.inventoryId || inv) || [],
        });
        setShowInventoryPicker(false);
        setInventoryPickerSearch("");
    };

    const openInventoryPicker = async () => {
        setShowInventoryPicker(true);
        if (inventoryPickerItems.length > 0) return; // already loaded
        setInventoryPickerLoading(true);
        try {
            const res = await fetch("/api/employee/inventory");
            const result = await res.json();
            if (res.ok && result.success) {
                setInventoryPickerItems(result.data || []);
            }
        } catch (e) {
            console.error("Failed to load inventory for picker:", e);
        } finally {
            setInventoryPickerLoading(false);
        }
    };

    const toggleInventoryItem = (inventoryId) => {
        setEditForm(f => {
            const exists = f.inventoryItems.includes(inventoryId);
            return {
                ...f,
                inventoryItems: exists
                    ? f.inventoryItems.filter(id => id !== inventoryId)
                    : [...f.inventoryItems, inventoryId],
            };
        });
    };  

    const handleEditSave = async () => {
        if (!editForm.vertical) {
            toast.error("Please select a vertical.", { id: "app-feedback", duration: 3000 });
            return;
        }
        if (!editForm.marketplace) {
            toast.error("Please select a marketplace.", { id: "app-feedback", duration: 3000 });
            return;
        }
        setEditSaving(true);
        try {
            const updatedStyleId = editForm.marketplace === "Myntra" ? (editForm.styleId ? editForm.styleId.trim() : null) : null;
            const payload = {
                id: editingListing._id,
                skuId: editingListing.skuId,
                ...editForm,
                styleId: updatedStyleId,
            };
            const res = await fetch("/api/employee/listing", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok && result.success) {
                toast.success("Listing updated successfully.", { id: "app-feedback", duration: 3000 });
                // Update local cache
                const updated = allListingsData.map(item =>
                    (editingListing._id ? item._id === editingListing._id : item.skuId === editingListing.skuId && item.marketplace === editingListing.marketplace)
                        ? {
                            ...item,
                            ...editForm,
                            styleId: updatedStyleId,
                            inventoryItems: editForm.inventoryItems.map(id => ({ inventoryId: id, imageUrl: item.inventoryItems.find(i => i.inventoryId === id)?.imageUrl || null }))
                        }
                        : item
                );
                setAllListingsData(updated);
                setEditingListing(null);
            } else {
                toast.error(result.error || "Failed to update listing.", { id: "app-feedback", duration: 3000 });
            }
        } catch (e) {
            console.error("Edit Error:", e);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setEditSaving(false);
        }
    };

    const openDeleteModal = (listing) => {
        setDeletingListing(listing);
        setDeleteInputText("");
    };

    const confirmDelete = async () => {
        if (!deletingListing) return;
        const id = deletingListing._id;
        const skuId = deletingListing.skuId;
        const marketplace = deletingListing.marketplace;
        setDeletingListingId(skuId);
        setDeleteButtonLoading(true);

        try {
            const deleteUrl = id 
                ? `/api/employee/listing?id=${id}` 
                : `/api/employee/listing?skuId=${skuId}&marketplace=${encodeURIComponent(marketplace)}`;
            const response = await fetch(deleteUrl, {
                method: "DELETE",
            });
            const result = await response.json();
            if (response.ok && result.success) {
                toast.success("Listing deleted successfully.", { id: "app-feedback", duration: 3000 });
                // Update local data
                const updatedData = allListingsData.filter(item => 
                    id ? item._id !== id : !(item.skuId === skuId && item.marketplace === marketplace)
                );
                setAllListingsData(updatedData);
                setDeletingListing(null);
                setDeleteInputText("");
            } else {
                toast.error(result.error || "Failed to delete listing.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Network Error:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setDeleteButtonLoading(false);
            setDeletingListingId(null);
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

    const fetchListings = async (forceRefresh = false) => {
        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        toast.dismiss("app-feedback");

        try {
            const response = await fetch("/api/employee/listing");
            const result = await response.json();

            if (response.ok && result.success) {
                const fetchedData = result.data || [];
                setAllListingsData(fetchedData);

                if (forceRefresh) {
                    toast.success("Listings refreshed successfully.", { id: "app-feedback", duration: 3000 });
                }
            } else {
                toast.error(result.error || "Failed to load listings.", { id: "app-feedback", duration: 3000 });
                if (!allListingsData.length) setAllListingsData([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Network error while loading data.", { id: "app-feedback", duration: 3000 });
            if (!allListingsData.length) setAllListingsData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDownloadExcel = () => {
        const filteredData = getFilteredListings();

        if (!filteredData || filteredData.length === 0) {
            toast.error("No filtered listings to download.", { id: "app-feedback", duration: 3000 });
            return;
        }

        const isMyntra = selectedMarketplace === "Myntra" || filteredData.some(item => item.marketplace === "Myntra" || Boolean(item.styleId));

        const dataToExport = filteredData.map(item => {
            const row = { "SKU ID": item.skuId };
            if (isMyntra) {
                row["Style ID"] = item.styleId || "";
            }
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        const colWidths = [{ wch: 25 }];
        if (isMyntra) {
            colWidths.push({ wch: 25 });
        }
        worksheet["!cols"] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "SKU List");

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestampStr = `${hours}-${minutes}-${seconds}`;

        const marketplaceSuffix = selectedMarketplace ? `_${selectedMarketplace}` : "";
        const fileName = `SKU_List${marketplaceSuffix}_${dateStr}_${timestampStr}.xlsx`;

        XLSX.writeFile(workbook, fileName);
        toast.success(`Excel sheet with all ${filteredData.length} filtered entries downloaded successfully.`, { id: "app-feedback", duration: 3000 });
    };

    const handleNextPage = () => setCurrentPage(prev => Math.min(Math.ceil(totalItems / pageSize) || 1, prev + 1));
    const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));

    const handleSearchQueryChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
    const handleInventoryIdQueryChange = (e) => { setInventoryIdQuery(e.target.value); setCurrentPage(1); };
    const handleStyleIdQueryChange = (e) => { setStyleIdQuery(e.target.value); setCurrentPage(1); };
    const handleSearchClick = () => setCurrentPage(1);
    const handleVerticalChange = (e) => {
        setSelectedVertical(e.target.value);
        setCurrentPage(1);
    };
    const handleMarketplaceChange = (e) => {
        setSelectedMarketplace(e.target.value);
        setCurrentPage(1);
    };
    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
        setCurrentPage(1);
    };
    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
        setCurrentPage(1);
    };
    const handlePageSizeChange = e => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    };

    const closeDetailModal = () => setSelectedListing(null);
    const closeEditModal = () => setEditingListing(null);
    const handleEditStatusChange = (s) => setEditForm(f => ({ ...f, status: s }));
    const handleEditMarketplaceChange = (mp) => setEditForm(f => ({ ...f, marketplace: mp }));
    const handleEditStyleIdChange = e => setEditForm(f => ({ ...f, styleId: e.target.value }));
    const handleEditVerticalChange = (verticalName) => setEditForm(f => ({ ...f, vertical: verticalName }));
    const handleRemoveInventoryItem = (id) => setEditForm(f => ({ ...f, inventoryItems: f.inventoryItems.filter(i => i !== id) }));
    const closeInventoryPicker = () => setShowInventoryPicker(false);
    const handleInventoryPickerSearchChange = e => setInventoryPickerSearch(e.target.value.toUpperCase());
    const clearInventoryPickerSearch = () => setInventoryPickerSearch('');
    const closeDeleteModal = () => setDeletingListing(null);
    const handleDeleteInputChange = (e) => setDeleteInputText(e.target.value);
    const handleDeleteInputKeyDown = (e) => {
        if (e.key === 'Enter' && deleteInputText.trim().toLowerCase() === 'delete' && !deleteButtonLoading) {
            confirmDelete();
        }
    };

    return (
        <div className={styles.container}>
            <ListingsToolbar
                searchQuery={searchQuery}
                inventoryIdQuery={inventoryIdQuery}
                styleIdQuery={styleIdQuery}
                selectedVertical={selectedVertical}
                selectedMarketplace={selectedMarketplace}
                selectedStatus={selectedStatus}
                sortOrder={sortOrder}
                verticals={verticals}
                refreshing={refreshing}
                totalItems={totalItems}
                onSearchQueryChange={handleSearchQueryChange}
                onSearch={handleSearch}
                onInventoryIdQueryChange={handleInventoryIdQueryChange}
                onStyleIdQueryChange={handleStyleIdQueryChange}
                onSearchClick={handleSearchClick}
                onRefresh={handleRefresh}
                onDownload={handleDownloadExcel}
                onVerticalChange={handleVerticalChange}
                onMarketplaceChange={handleMarketplaceChange}
                onStatusChange={handleStatusChange}
                onSortOrderChange={handleSortOrderChange}
                onReset={handleReset}
            />

            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading Listings...</p>
                </div>
            ) : listings.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No listings found.</p>
                </div>
            ) : (
                <div className={styles.contentArea}>
                    <div className={styles.scrollWrapper}>
                        <div className={styles.gridContainer}>
                                {listings.map((item, index) => (
                                    <ListingCard
                                        key={index}
                                        item={item}
                                        deleteButtonLoading={deleteButtonLoading}
                                        deletingListingId={deletingListingId}
                                        onSelect={setSelectedListing}
                                        onDelete={openDeleteModal}
                                        onEdit={openEditModal}
                                        onCopy={copyToClipboard}
                                    />
                                ))}
                            </div>
                    </div>
                    {/* Pagination */}
                    {totalItems > 0 && (
                        <ListingsPagination
                            currentPage={currentPage}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            onPageSizeChange={handlePageSizeChange}
                            onPrevPage={handlePrevPage}
                            onNextPage={handleNextPage}
                        />
                    )}
                </div>
            )}

            {/* Listing Details Modal */}
            {selectedListing && (
                <ListingDetailModal
                    selectedListing={selectedListing}
                    onClose={closeDetailModal}
                    onCopy={copyToClipboard}
                />
            )}

            {/* ── EDIT MODAL ─────────────────────────────────────── */}
            {editingListing && (
                <EditListingModal
                    editingListing={editingListing}
                    editForm={editForm}
                    verticals={verticals}
                    editSaving={editSaving}
                    onStatusChange={handleEditStatusChange}
                    onMarketplaceChange={handleEditMarketplaceChange}
                    onStyleIdChange={handleEditStyleIdChange}
                    onVerticalChange={handleEditVerticalChange}
                    onRemoveInventoryItem={handleRemoveInventoryItem}
                    onOpenInventoryPicker={openInventoryPicker}
                    onSave={handleEditSave}
                    onClose={closeEditModal}
                />
            )}

            {/* ── INVENTORY PICKER MODAL ──────────────────────────── */}
            {showInventoryPicker && (
                <InventoryPickerModal
                    selectedInventoryIds={editForm.inventoryItems}
                    inventoryPickerItems={inventoryPickerItems}
                    inventoryPickerLoading={inventoryPickerLoading}
                    inventoryPickerSearch={inventoryPickerSearch}
                    onSearchChange={handleInventoryPickerSearchChange}
                    onClearSearch={clearInventoryPickerSearch}
                    onToggleItem={toggleInventoryItem}
                    onClose={closeInventoryPicker}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deletingListing && (
                <DeleteListingModal
                    deletingListing={deletingListing}
                    deleteInputText={deleteInputText}
                    deleteButtonLoading={deleteButtonLoading}
                    onInputChange={handleDeleteInputChange}
                    onInputKeyDown={handleDeleteInputKeyDown}
                    onConfirm={confirmDelete}
                    onClose={closeDeleteModal}
                />
            )}

                </div>
    );
}
