"use client";
import { toast } from "sonner";

import { useState } from "react";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import PageShell from "@/components/ui/PageShell/PageShell";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./page.module.css";

import ListingsToolbar from "./_components/ListingsToolbar/ListingsToolbar";
import ListingCard from "./_components/ListingCard/ListingCard";
import ListingsPagination from "./_components/ListingsPagination/ListingsPagination";
import ListingDetailModal from "./_components/ListingDetailModal/ListingDetailModal";
import EditListingModal from "./_components/EditListingModal/EditListingModal";
import InventoryPickerModal from "./_components/InventoryPickerModal/InventoryPickerModal";
import DeleteListingModal from "./_components/DeleteListingModal/DeleteListingModal";
import useListingsData from "./_hooks/useListingsData";
import useListingsFilters from "./_hooks/useListingsFilters";
import useListingEdit from "./_hooks/useListingEdit";
import useListingDelete from "./_hooks/useListingDelete";
import useListingsExport from "./_hooks/useListingsExport";

export default function AllListingsPage() {
    const { allListingsData, setAllListingsData, verticals, loading, refreshing, fetchListings } = useListingsData();
    const {
        listings, currentPage, totalItems, pageSize,
        sortOrder, selectedVertical, selectedMarketplace, selectedStatus,
        searchQuery, inventoryIdQuery, styleIdQuery,
        getFilteredListings,
        handleSearch, handleReset, handleRefresh, handleNextPage, handlePrevPage,
        handleSearchQueryChange, handleInventoryIdQueryChange, handleStyleIdQueryChange, handleSearchClick,
        handleVerticalChange, handleMarketplaceChange, handleStatusChange, handleSortOrderChange, handlePageSizeChange,
    } = useListingsFilters({ allListingsData, fetchListings });
    const {
        editingListing, editForm, editSaving,
        showInventoryPicker, inventoryPickerItems, inventoryPickerLoading, inventoryPickerSearch,
        openEditModal, openInventoryPicker, toggleInventoryItem, handleEditSave, closeEditModal,
        handleEditStatusChange, handleEditMarketplaceChange, handleEditStyleIdChange, handleEditVerticalChange,
        handleRemoveInventoryItem, closeInventoryPicker, handleInventoryPickerSearchChange, clearInventoryPickerSearch,
    } = useListingEdit({ allListingsData, setAllListingsData });
    const {
        deleteButtonLoading, deletingListingId, deletingListing, deleteInputText,
        openDeleteModal, confirmDelete, closeDeleteModal, handleDeleteInputChange, handleDeleteInputKeyDown,
    } = useListingDelete({ allListingsData, setAllListingsData });
    const { handleDownloadExcel } = useListingsExport({ getFilteredListings, selectedMarketplace });

    // Detail Modal State
    const [selectedListing, setSelectedListing] = useState(null);

    const copyToClipboard = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard!`, { id: "app-feedback", duration: 3000 });
        } catch (err) {
            console.error("Failed to copy:", err);
            toast.error("Failed to copy to clipboard", { id: "app-feedback", duration: 3000 });
        }
    };

    const closeDetailModal = () => setSelectedListing(null);

    return (
        <PageShell>
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
                <div className={styles.grid} role="status" aria-busy="true">
                    <span className="srOnly">Loading Listings...</span>
                    {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <Skeleton className={styles.skeletonMedia} />
                            <Skeleton variant="text" width="70%" />
                            <Skeleton variant="text" width="40%" />
                        </div>
                    ))}
                </div>
            ) : listings.length === 0 ? (
                <EmptyState title="No listings found." />
            ) : (
                <>
                    <div className={styles.grid}>
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
                </>
            )}
            {selectedListing && (
                <ListingDetailModal
                    selectedListing={selectedListing}
                    onClose={closeDetailModal}
                    onCopy={copyToClipboard}
                />
            )}
            {editingListing && (
                <EditListingModal
                    editingListing={editingListing}
                    editForm={editForm}
                    verticals={verticals}
                    editSaving={editSaving}
                    pickerOpen={showInventoryPicker}
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
        </PageShell>
    );
}
