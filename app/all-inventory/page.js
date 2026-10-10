"use client";
import { toast } from "sonner";

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
import { useAuth } from "../../components/AuthProvider";
import useInventoryData from "./_hooks/useInventoryData";
import useInventoryDetail from "./_hooks/useInventoryDetail";
import useInventoryFilters from "./_hooks/useInventoryFilters";
import useInventoryActions from "./_hooks/useInventoryActions";
import useInventoryEdit from "./_hooks/useInventoryEdit";

export default function AllInventoryPage() {
    // Hook order keeps the original effect order: archived ref sync, mount load, detail SKUs, local filtering
    const {
        allInventoryData, setAllInventoryData, verticals, loading, refreshing,
        showArchived, setShowArchived, fetchInventory,
    } = useInventoryData();
    const { selectedItem, setSelectedItem, modalSkus, modalSkusLoading } = useInventoryDetail();
    const {
        inventory, currentPage, totalItems, pageSize, sortOrder, selectedVertical, searchQuery,
        handleSearch, handleReset, handleRefresh, handleNextPage, handlePrevPage,
        handleSearchQueryChange, handleVerticalChange, handleSortOrderChange, handleToggleArchived, handlePageSizeChange,
    } = useInventoryFilters({ allInventoryData, showArchived, setShowArchived, fetchInventory });
    const {
        deleteButtonLoading, deletingItemId, showDeleteConfirm, setShowDeleteConfirm,
        showRestoreConfirm, setShowRestoreConfirm, restoreButtonLoading,
        showPermDeleteConfirm, setShowPermDeleteConfirm, permDeleteLoading,
        handleDelete, confirmDelete, handleRestore, confirmRestore, handlePermanentDelete, confirmPermanentDelete,
    } = useInventoryActions({ allInventoryData, setAllInventoryData, fetchInventory });
    const {
        editingItem, editForm, editSaving, openEditModal, closeEditModal, handleEditFormChange, handleSaveEdit,
    } = useInventoryEdit({ fetchInventory, showArchived });

    const { user } = useAuth();

    const copyToClipboard = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard!`, { id: "app-feedback", duration: 3000 });
        } catch (err) {
            console.error("Failed to copy:", err);
            toast.error("Failed to copy to clipboard", { id: "app-feedback", duration: 3000 });
        }
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
